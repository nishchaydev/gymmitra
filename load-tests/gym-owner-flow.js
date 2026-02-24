import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// --- Custom Metrics ---
const errorRate = new Rate('custom_errors');
const memberCreationTime = new Trend('member_creation_duration');
const invoiceCreationTime = new Trend('invoice_creation_duration');

// --- Target Environment ---
// Override via: k6 run -e BASE_URL=https://staging.gym.emitra.dev ...
const BASE_URL = __ENV.BASE_URL || 'https://gym.emitra.dev';

// --- Auth (REQUIRED — no defaults) ---
// Set before running:
//   $env:LOAD_TEST_EMAIL    = "loadtest@yourgym.com"
//   $env:LOAD_TEST_PASSWORD = "YourSecurePassword123!"
const TEST_EMAIL = __ENV.LOAD_TEST_EMAIL;
const TEST_PASSWORD = __ENV.LOAD_TEST_PASSWORD;

// --- Load Profile: Gradual ramp to 1000 concurrent users ---
export const options = {
    stages: [
        { duration: '2m', target: 100 },   // Ramp: 0 → 100
        { duration: '5m', target: 100 },   // Hold: 100
        { duration: '2m', target: 500 },   // Ramp: 100 → 500
        { duration: '5m', target: 500 },   // Hold: 500
        { duration: '2m', target: 1000 },  // Ramp: 500 → 1000
        { duration: '5m', target: 1000 },  // Hold: 1000 (peak)
        { duration: '2m', target: 0 },     // Ramp-down
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000', 'p(99)<4000'],
        http_req_failed: ['rate<0.05'],
        'http_req_duration{name:Dashboard}': ['p(95)<3000'],
        'http_req_duration{name:MembersList}': ['p(95)<1500'],
        'http_req_duration{name:ReportSummary}': ['p(95)<4000'],
        custom_errors: ['rate<0.10'],
    },
};

export function setup() {
    // Fail fast if credentials are missing — do not run with empty auth
    if (!TEST_EMAIL || !TEST_PASSWORD) {
        throw new Error(
            'Missing required env vars.\n' +
            '  $env:LOAD_TEST_EMAIL    = "loadtest@yourgym.com"\n' +
            '  $env:LOAD_TEST_PASSWORD = "YourSecurePassword123!"\n' +
            'Create the account at gym.emitra.dev/onboarding first.'
        );
    }
    console.log(`🚀 Gym Mitra Load Test | Target: ${BASE_URL}`);
    return { startTime: Date.now() };
}

export default function () {
    // ─────────────────────────────────────────────────
    // STEP 1: Authenticate via Supabase (cookie-based)
    // ─────────────────────────────────────────────────
    const loginRes = http.post(
        `${BASE_URL}/api/auth/signin`,
        JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
        {
            headers: { 'Content-Type': 'application/json' },
            redirects: 5,
            tags: { name: 'Login' },
        }
    );

    const authed = check(loginRes, {
        'auth: status 200, 302, or 303': (r) =>
            r.status === 200 || r.status === 302 || r.status === 303,
    });

    if (!authed) {
        errorRate.add(1);
        return; // Stop this VU iteration — no point hitting auth-protected routes
    }

    // k6 carries session cookies automatically per VU cookie jar
    const sessionHeaders = { headers: { 'Content-Type': 'application/json' } };

    sleep(1);

    // ─────────────────────────────────────────────────
    // STEP 2: Dashboard (SSR page — most common action)
    // ─────────────────────────────────────────────────
    const dashboardRes = http.get(`${BASE_URL}/dashboard`, {
        tags: { name: 'Dashboard' },
    });

    check(dashboardRes, {
        'dashboard: status 200 or 302': (r) =>
            r.status === 200 || r.status === 302,
        'dashboard: loads within 3s': (r) => r.timings.duration < 3000,
    });

    sleep(2);

    // ─────────────────────────────────────────────────
    // STEP 3: Members List — functional check only
    // Timing is enforced by per-tag threshold above
    // Rate limit: 100 req/min per user
    // ─────────────────────────────────────────────────
    const membersRes = http.get(`${BASE_URL}/api/members`, {
        tags: { name: 'MembersList' },
    });

    const membersOk = check(membersRes, {
        'members: status 200': (r) => r.status === 200,
        'members: returns array': (r) => {
            try { return Array.isArray(JSON.parse(r.body)); }
            catch (e) { return false; }
        },
    });

    // Only count as an error when the response is functionally wrong
    // (not a rate-limit 429 — that's expected at peak load)
    if (!membersOk && membersRes.status !== 429) {
        errorRate.add(1);
    }

    sleep(1);

    // ─────────────────────────────────────────────────
    // STEP 4: Invoices List
    // ─────────────────────────────────────────────────
    const invoicesRes = http.get(`${BASE_URL}/api/invoices`, {
        tags: { name: 'InvoicesList' },
    });

    check(invoicesRes, {
        'invoices: status 200': (r) => r.status === 200,
    });

    sleep(1);

    // ─────────────────────────────────────────────────
    // STEP 5: Create New Member (write operation)
    // 10-digit unique phone: '9' + 5-digit VU + 4-digit ITER
    // Email uses separator to guarantee uniqueness
    // Tag records for teardown cleanup
    // ─────────────────────────────────────────────────
    const uniquePhone = `9${String(__VU).padStart(5, '0')}${String(__ITER).padStart(4, '0')}`;
    const newMember = {
        name: `Load Test Member ${__VU}-${__ITER}`,
        phone: uniquePhone,
        email: `lt${__VU}-${__ITER}@loadtest.dev`,
        dateOfBirth: '1995-06-15',
        emergencyName: 'Load Test Emergency',
        emergencyPhone: '9000000000',
        emergencyRelation: 'SPOUSE',
        // Tag so teardown can identify and delete all k6-generated records
        notes: 'k6-load-test',
    };

    const addMemberRes = http.post(
        `${BASE_URL}/api/members`,
        JSON.stringify(newMember),
        { ...sessionHeaders, tags: { name: 'AddMember' } }
    );

    // Only record timing when the request was actually processed (not rate-limited)
    if (addMemberRes.status !== 429) {
        memberCreationTime.add(addMemberRes.timings.duration);
    }

    const memberCreated = check(addMemberRes, {
        'add member: status 201': (r) => r.status === 201,
        'add member: returns id': (r) => {
            try { return !!JSON.parse(r.body).id; }
            catch (e) { return false; }
        },
        'add member: under 500ms': (r) => r.timings.duration < 500,
    });

    if (!memberCreated && addMemberRes.status !== 409 && addMemberRes.status !== 429) {
        errorRate.add(1);
    }

    sleep(2);

    // ─────────────────────────────────────────────────
    // STEP 6: Create Invoice (rate limit: 20/min)
    // 429s are expected at 1000 VUs — not counted as errors
    // ─────────────────────────────────────────────────
    let newMemberId = null;
    if (memberCreated && addMemberRes.body) {
        try { newMemberId = JSON.parse(addMemberRes.body).id; } catch (e) { }
    }

    const invoicePayload = {
        type: 'MEMBERSHIP',
        paymentStatus: 'PAID',
        paymentMethod: 'UPI',
        items: [{ description: 'Monthly Membership — k6-load-test', quantity: 1, unitPrice: 2000 }],
        tax: 0,
        discount: 0,
        notes: 'k6-load-test',
        ...(newMemberId ? { memberId: newMemberId } : {}),
    };

    const invoiceRes = http.post(
        `${BASE_URL}/api/invoices`,
        JSON.stringify(invoicePayload),
        { ...sessionHeaders, tags: { name: 'CreateInvoice' } }
    );

    // Only record timing for actually-processed requests (not rate-limited 429s)
    if (invoiceRes.status !== 429) {
        invoiceCreationTime.add(invoiceRes.timings.duration);
    }

    check(invoiceRes, {
        'invoice: status 201 or 429': (r) => r.status === 201 || r.status === 429,
        'invoice: under 2s (if not rate-limited)': (r) =>
            r.status === 429 || r.timings.duration < 2000,
    });

    sleep(2);

    // ─────────────────────────────────────────────────
    // STEP 7: Report Summary (5 parallel DB queries — heaviest endpoint)
    // ─────────────────────────────────────────────────
    const reportRes = http.get(`${BASE_URL}/api/reports?type=summary`, {
        tags: { name: 'ReportSummary' },
    });

    check(reportRes, {
        'report summary: status 200': (r) => r.status === 200,
        'report summary: under 4s': (r) => r.timings.duration < 4000,
    });

    sleep(1);

    // ─────────────────────────────────────────────────
    // STEP 8: Report Revenue (raw SQL aggregation)
    // ─────────────────────────────────────────────────
    const revenueRes = http.get(`${BASE_URL}/api/reports?type=revenue`, {
        tags: { name: 'ReportRevenue' },
    });

    check(revenueRes, {
        'report revenue: status 200': (r) => r.status === 200,
    });

    sleep(1);

    // ─────────────────────────────────────────────────
    // STEP 9: Products List
    // ─────────────────────────────────────────────────
    const productsRes = http.get(`${BASE_URL}/api/products`, {
        tags: { name: 'ProductsList' },
    });

    check(productsRes, {
        'products: status 200': (r) => r.status === 200,
    });

    sleep(3);
}

export function teardown(data) {
    const totalSeconds = ((Date.now() - data.startTime) / 1000).toFixed(1);
    console.log(`✅ Load test complete. Duration: ${totalSeconds}s`);

    // Clean up test data — delete records tagged 'k6-load-test'
    // Note: This requires a DELETE endpoint for bulk operations.
    // For now, log the cleanup SQL for a developer to run manually.
    // To auto-clean, run this in Supabase SQL Editor after the test:
    //   DELETE FROM "Member" WHERE notes = 'k6-load-test';
    //   DELETE FROM "Invoice" WHERE notes = 'k6-load-test';
    console.log('📌 Cleanup reminder: run in Supabase SQL Editor:');
    console.log('   DELETE FROM "Invoice" WHERE notes = \'k6-load-test\';');
    console.log('   DELETE FROM "Member"  WHERE notes = \'k6-load-test\';');
}
