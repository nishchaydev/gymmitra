import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// --- Custom Metrics ---
const errorRate = new Rate('custom_errors');
const memberCreationTime = new Trend('member_creation_duration');
const invoiceCreationTime = new Trend('invoice_creation_duration');

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
    // Success criteria — test FAILS if any threshold is breached
    thresholds: {
        http_req_duration: ['p(95)<2000', 'p(99)<4000'], // 95% under 2s, 99% under 4s
        http_req_failed: ['rate<0.05'],                  // Less than 5% HTTP errors
        'http_req_duration{name:Dashboard}': ['p(95)<3000'],
        'http_req_duration{name:MembersList}': ['p(95)<1500'],
        'http_req_duration{name:ReportSummary}': ['p(95)<4000'],
        custom_errors: ['rate<0.10'],
    },
};

const BASE_URL = 'https://gym.emitra.dev';

// --- Test Credentials ---
// IMPORTANT: These are REAL test accounts that must exist in Supabase.
// Create one test account per VU group or use a shared account.
// Using a shared account is simpler; the session is per-VU anyway.
const TEST_EMAIL = __ENV.LOAD_TEST_EMAIL || 'loadtest@emitra.dev';
const TEST_PASSWORD = __ENV.LOAD_TEST_PASSWORD || 'LoadTest123!@#';

export function setup() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   Gym Mitra Load Test — Starting...    ║');
    console.log(`║   Target: ${BASE_URL}    ║`);
    console.log('║   Peak Load: 1000 concurrent users     ║');
    console.log('╚════════════════════════════════════════╝');
    return { startTime: Date.now() };
}

export default function () {
    // ─────────────────────────────────────────────────
    // STEP 1: Authenticate (Supabase cookie-based auth)
    // The app uses Supabase Auth → session stored in cookies.
    // k6 automatically carries cookies across redirects within a session.
    // ─────────────────────────────────────────────────
    const loginRes = http.post(
        `${BASE_URL}/api/auth/callback`,
        JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
        {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'Login' },
        }
    );

    // Supabase login via the Next.js app action
    // Try the standard Supabase API if the above doesn't apply
    const supabaseLoginRes = http.post(
        `${BASE_URL}/api/auth/signin`,
        JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
        {
            headers: { 'Content-Type': 'application/json' },
            redirects: 5,
            tags: { name: 'Login' },
        }
    );

    const authed = check(supabaseLoginRes, {
        'auth: status 200 or 302': (r) => r.status === 200 || r.status === 302 || r.status === 303,
    });

    if (!authed) {
        // Try a direct page visit — Supabase may set cookies on page load
        const homeRes = http.get(`${BASE_URL}/`, { tags: { name: 'Home' } });
        check(homeRes, { 'homepage: status 200': (r) => r.status === 200 });
    }

    sleep(1);

    // ─────────────────────────────────────────────────
    // STEP 2: Dashboard (SSR page — most common action)
    // ─────────────────────────────────────────────────
    const dashboardRes = http.get(`${BASE_URL}/dashboard`, {
        tags: { name: 'Dashboard' },
    });

    check(dashboardRes, {
        'dashboard: status 200 or 302': (r) => r.status === 200 || r.status === 302,
        'dashboard: loads within 3s': (r) => r.timings.duration < 3000,
    });

    sleep(2); // User reads dashboard

    // ─────────────────────────────────────────────────
    // STEP 3: Members List (paginated DB query)
    // Rate limit: 100 req/min per user
    // ─────────────────────────────────────────────────
    const membersRes = http.get(`${BASE_URL}/api/members`, {
        tags: { name: 'MembersList' },
    });

    const membersOk = check(membersRes, {
        'members: status 200': (r) => r.status === 200,
        'members: loads within 1.5s': (r) => r.timings.duration < 1500,
        'members: returns array': (r) => {
            try { return Array.isArray(JSON.parse(r.body)); }
            catch (e) { return false; }
        },
    });

    if (!membersOk && membersRes.status !== 429) {
        errorRate.add(1);
    }

    sleep(1);

    // ─────────────────────────────────────────────────
    // STEP 4: View Invoices List
    // Rate limit: 100 req/min per user
    // ─────────────────────────────────────────────────
    const invoicesRes = http.get(`${BASE_URL}/api/invoices`, {
        tags: { name: 'InvoicesList' },
    });

    check(invoicesRes, {
        'invoices: status 200': (r) => r.status === 200,
        'invoices: loads within 1.5s': (r) => r.timings.duration < 1500,
    });

    sleep(1);

    // ─────────────────────────────────────────────────
    // STEP 5: Create New Member (write operation)
    // Rate limit: 50 creations/min per user
    // Uses unique phone number per VU+iteration to avoid P2002 conflicts
    // ─────────────────────────────────────────────────
    const uniquePhone = `9${String(__VU).padStart(4, '0')}${String(__ITER).padStart(4, '0')}`;
    const newMember = {
        name: `Load Test Member ${__VU}-${__ITER}`,
        phone: uniquePhone,
        email: `lt${__VU}${__ITER}@loadtest.dev`,
        dateOfBirth: '1995-06-15',
        emergencyName: 'Emergency Contact',
        emergencyPhone: '9000000000',
        emergencyRelation: 'SPOUSE',
    };

    const addMemberRes = http.post(
        `${BASE_URL}/api/members`,
        JSON.stringify(newMember),
        {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'AddMember' },
        }
    );

    memberCreationTime.add(addMemberRes.timings.duration);

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
    // STEP 6: Create Invoice (complex write — rate limit 20/min)
    // NOTE: Rate limit of 20/min means heavy users will see 429s.
    // At 1000 VUs this is expected. We allow 429 as non-error.
    // ─────────────────────────────────────────────────
    let newMemberId = null;
    if (memberCreated && addMemberRes.body) {
        try { newMemberId = JSON.parse(addMemberRes.body).id; } catch (e) { }
    }

    const invoicePayload = {
        type: 'MEMBERSHIP',
        paymentStatus: 'PAID',
        paymentMethod: 'UPI',
        items: [
            {
                description: 'Monthly Membership — Load Test',
                quantity: 1,
                unitPrice: 2000,
            },
        ],
        tax: 0,
        discount: 0,
        notes: 'k6 load test invoice',
        ...(newMemberId ? { memberId: newMemberId } : {}),
    };

    const invoiceRes = http.post(
        `${BASE_URL}/api/invoices`,
        JSON.stringify(invoicePayload),
        {
            headers: { 'Content-Type': 'application/json' },
            tags: { name: 'CreateInvoice' },
        }
    );

    invoiceCreationTime.add(invoiceRes.timings.duration);

    check(invoiceRes, {
        'invoice: status 201 or 429': (r) => r.status === 201 || r.status === 429,
        'invoice: under 2s (if not rate-limited)': (r) =>
            r.status === 429 || r.timings.duration < 2000,
    });

    sleep(2);

    // ─────────────────────────────────────────────────
    // STEP 7: Reports — Summary (5 parallel DB queries)
    // This is the heaviest endpoint
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
    // STEP 8: Reports — Revenue (raw SQL aggregation)
    // ─────────────────────────────────────────────────
    const revenueRes = http.get(`${BASE_URL}/api/reports?type=revenue`, {
        tags: { name: 'ReportRevenue' },
    });

    check(revenueRes, {
        'report revenue: status 200': (r) => r.status === 200,
    });

    sleep(1);

    // ─────────────────────────────────────────────────
    // STEP 9: Products List (simple read)
    // ─────────────────────────────────────────────────
    const productsRes = http.get(`${BASE_URL}/api/products`, {
        tags: { name: 'ProductsList' },
    });

    check(productsRes, {
        'products: status 200': (r) => r.status === 200,
    });

    sleep(3); // Realistic think time between iterations
}

export function teardown(data) {
    const totalSeconds = ((Date.now() - data.startTime) / 1000).toFixed(1);
    console.log('╔════════════════════════════════════════╗');
    console.log('║   Load Test Complete ✅                 ║');
    console.log(`║   Total duration: ${totalSeconds}s              ║`);
    console.log('║   Check Vercel + Supabase dashboards   ║');
    console.log('╚════════════════════════════════════════╝');
}
