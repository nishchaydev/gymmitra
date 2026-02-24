import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Trend } from 'k6/metrics';

/**
 * Soak Test — Long-Duration Stability Test
 *
 * Goal: Detect memory leaks, DB connection exhaustion, and slow degradation.
 * Watch: response times should NOT increase over 4 hours.
 *
 * Requires: LOAD_TEST_EMAIL + LOAD_TEST_PASSWORD env vars.
 *
 * Target prod:    k6 run -e BASE_URL=https://gym.emitra.dev -e LOAD_TEST_EMAIL=... -e LOAD_TEST_PASSWORD=... load-tests/soak-test.js
 * Target staging: k6 run -e BASE_URL=https://staging.gym.emitra.dev -e LOAD_TEST_EMAIL=... -e LOAD_TEST_PASSWORD=... load-tests/soak-test.js
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
        // Single unified http_req_failed with abortOnFail — no duplicate keys
        http_req_failed: [{ threshold: 'rate<0.02', abortOnFail: true, delayAbortEval: '30m' }],
        // Per-endpoint thresholds — alerts when a specific route degrades
        soak_duration_members: ['p(95)<1500', 'p(99)<3000'],
        soak_duration_invoices: ['p(95)<1500', 'p(99)<3000'],
        soak_duration_dashboard: ['p(95)<3000', 'p(99)<5000'],
        soak_duration_reports: ['p(95)<4000', 'p(99)<6000'],
        soak_duration_products: ['p(95)<1000', 'p(99)<2000'],
    },
};

export function setup() {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
        throw new Error(
            'Missing LOAD_TEST_EMAIL / LOAD_TEST_PASSWORD env vars for soak auth.\n' +
            '  k6 run -e LOAD_TEST_EMAIL=... -e LOAD_TEST_PASSWORD=... load-tests/soak-test.js'
        );
    }

    const loginRes = http.post(
        `${BASE_URL}/api/auth/signin`,
        JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
        { headers: { 'Content-Type': 'application/json' }, redirects: 5 }
    );

    // Fail fast — do not start the 4-hour soak with broken auth
    if (loginRes.status !== 200) {
        // Never include body content in logs — may contain tokens or PII
        fail(
            `Soak auth failed: HTTP ${loginRes.status} | ` +
            `hasBody: ${Boolean(loginRes.body)} | bodyLength: ${loginRes.body ? loginRes.body.length : 0} | ` +
            `error: ${loginRes.error || 'none'}`
        );
    }

    const cookies = loginRes.cookies;

    // Guard: ensure we got actual cookie entries with values — empty cookies
    // would cause all VUs to run silently unauthenticated for 4 hours.
    if (!cookies || Object.keys(cookies).length === 0) {
        fail('Soak auth error: login returned no cookies — session was not established.');
    }

    const cookieHeader = Object.keys(cookies)
        .filter((key) => Array.isArray(cookies[key]) && cookies[key].length > 0 && cookies[key][0].value)
        .map((key) => `${key}=${cookies[key][0].value}`)
        .join('; ');

    if (!cookieHeader) {
        fail('Soak auth error: cookie header is empty after extraction — all cookie values were missing.');
    }

    console.log(`✅ Soak auth OK — starting 4-hour run against ${BASE_URL}`);
    return { cookie: cookieHeader };
}

export default function (data) {
    // GET-only requests — no Content-Type header needed
    const authHeaders = { headers: { Cookie: data.cookie } };

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
