import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

/**
 * Soak Test — Long-Duration Stability Test
 *
 * Goal: Detect memory leaks, DB connection exhaustion, and slow degradation.
 * Watch: response times should NOT increase over 4 hours.
 *
 * Requires: LOAD_TEST_EMAIL + LOAD_TEST_PASSWORD env vars (same test account
 * used in gym-owner-flow.js).
 *
 * Target prod:   k6 run -e BASE_URL=https://gym.emitra.dev -e LOAD_TEST_EMAIL=... -e LOAD_TEST_PASSWORD=... load-tests/soak-test.js
 * Target staging: k6 run -e BASE_URL=https://staging.gym.emitra.dev load-tests/soak-test.js
 *
 * Default BASE_URL is localhost so running with no args won't hit prod.
 */

// --- Target (safe non-prod default) ---
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const TEST_EMAIL = __ENV.LOAD_TEST_EMAIL;
const TEST_PASSWORD = __ENV.LOAD_TEST_PASSWORD;

// --- Per-endpoint Trends for detecting per-route degradation ---
const trends = {
    members: new Trend('soak_duration_members'),
    invoices: new Trend('soak_duration_invoices'),
    dashboard: new Trend('soak_duration_dashboard'),
    reports: new Trend('soak_duration_reports'),
    products: new Trend('soak_duration_products'),
};

export const options = {
    stages: [
        { duration: '5m', target: 100 },  // Ramp up
        { duration: '4h', target: 100 },  // SOAK: hold for 4 hours
        { duration: '5m', target: 0 },    // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<1500'],
        http_req_failed: ['rate<0.02'],
        // Per-endpoint thresholds to catch degradation on specific routes
        soak_duration_members: ['p(95)<1500', 'p(99)<3000'],
        soak_duration_reports: ['p(95)<4000', 'p(99)<6000'],
        soak_duration_dashboard: ['p(95)<3000'],
        // If any threshold is violated after 30 min warm-up, abort the 4h run
        'http_req_failed': [{ threshold: 'rate<0.02', abortOnFail: true, delayAbortEval: '30m' }],
    },
};

export function setup() {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
        throw new Error(
            'Missing LOAD_TEST_EMAIL / LOAD_TEST_PASSWORD env vars for soak auth.'
        );
    }

    // Authenticate once and return the cookie so all VUs can reuse it
    const loginRes = http.post(
        `${BASE_URL}/api/auth/signin`,
        JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
        { headers: { 'Content-Type': 'application/json' }, redirects: 5 }
    );

    const cookies = loginRes.cookies;
    const cookieHeader = Object.keys(cookies)
        .map((key) => `${key}=${cookies[key][0].value}`)
        .join('; ');

    console.log(`🧪 Soak test auth: ${loginRes.status === 200 ? 'OK' : 'FAILED'}`);
    return { cookie: cookieHeader, startTime: Date.now() };
}

export default function (data) {
    const authHeaders = {
        headers: { Cookie: data.cookie, 'Content-Type': 'application/json' },
    };

    // Randomised usage pattern — realistic mix across all endpoints
    const rand = Math.random();

    if (rand < 0.40) {
        // 40%: Members list (most common read)
        const res = http.get(`${BASE_URL}/api/members`, {
            ...authHeaders,
            tags: { name: 'Soak_Members' },
        });
        trends.members.add(res.timings.duration);
        check(res, { 'soak: members 200': (r) => r.status === 200 });

    } else if (rand < 0.65) {
        // 25%: Invoices list
        const res = http.get(`${BASE_URL}/api/invoices`, {
            ...authHeaders,
            tags: { name: 'Soak_Invoices' },
        });
        trends.invoices.add(res.timings.duration);
        check(res, { 'soak: invoices 200': (r) => r.status === 200 });

    } else if (rand < 0.80) {
        // 15%: Dashboard SSR
        const res = http.get(`${BASE_URL}/dashboard`, {
            ...authHeaders,
            tags: { name: 'Soak_Dashboard' },
        });
        trends.dashboard.add(res.timings.duration);
        check(res, { 'soak: dashboard 200 or redirect': (r) => r.status === 200 || r.status === 302 });

    } else if (rand < 0.90) {
        // 10%: Reports summary (most DB-intensive)
        const res = http.get(`${BASE_URL}/api/reports?type=summary`, {
            ...authHeaders,
            tags: { name: 'Soak_Reports' },
        });
        trends.reports.add(res.timings.duration);
        check(res, { 'soak: reports 200': (r) => r.status === 200 });

    } else {
        // 10%: Products
        const res = http.get(`${BASE_URL}/api/products`, {
            ...authHeaders,
            tags: { name: 'Soak_Products' },
        });
        trends.products.add(res.timings.duration);
        check(res, { 'soak: products 200': (r) => r.status === 200 });
    }

    // Realistic think time: 5–15 seconds between requests
    sleep(5 + Math.random() * 10);
}
