import http from 'k6/http';
import { check } from 'k6';

/**
 * API-Only Benchmark — Fast, No Auth
 *
 * Tests raw API server throughput at 1000 VUs for 1 minute.
 * All endpoints return 401 (unauthenticated) — that is EXPECTED and correct.
 * We're validating: does the server respond at all without crashing?
 *
 * IMPORTANT: Always pass BASE_URL explicitly — no production default.
 *
 * Run (staging):
 *   k6 run -e BASE_URL=https://staging.gym.emitra.dev load-tests/api-only-test.js
 *
 * Run (production):
 *   k6 run -e BASE_URL=https://gym.emitra.dev load-tests/api-only-test.js
 */

// --- Target (REQUIRED — no default to avoid accidental prod hits) ---
if (!__ENV.BASE_URL) {
    throw new Error(
        'BASE_URL env var is required.\n' +
        '  k6 run -e BASE_URL=https://staging.gym.emitra.dev load-tests/api-only-test.js\n' +
        '  k6 run -e BASE_URL=https://gym.emitra.dev load-tests/api-only-test.js'
    );
}
const BASE_URL = __ENV.BASE_URL;

// Mark 401 and 429 as non-failing — both are expected for unauthenticated requests
// This prevents k6 from counting them in http_req_failed
http.setResponseCallback(http.expectedStatuses(
    { min: 200, max: 399 },
    401,
    429
));

export const options = {
    vus: 1000,
    duration: '1m',
    thresholds: {
        // 401/429 are now non-failing, so only real errors (5xx, timeouts) count
        http_req_failed: ['rate<0.01'],
        // p(95) across all API endpoints should be under 800ms
        http_req_duration: ['p(95)<800'],
    },
};

// JSON API endpoints only — no frontend routes
const ENDPOINTS = [
    { url: `${BASE_URL}/api/members`, tag: 'API_Members' },
    { url: `${BASE_URL}/api/invoices`, tag: 'API_Invoices' },
    { url: `${BASE_URL}/api/products`, tag: 'API_Products' },
    { url: `${BASE_URL}/api/reports?type=summary`, tag: 'API_Reports' },
];

export default function () {
    // Combine VU offset + iteration rotation so concurrent VUs are spread across
    // different endpoints rather than hitting the same one simultaneously
    const endpoint = ENDPOINTS[(__VU - 1 + __ITER) % ENDPOINTS.length];

    const res = http.get(endpoint.url, { tags: { name: endpoint.tag } });

    check(res, {
        // Status 0 = network error / timeout — also a failure
        'valid response (no 5xx or timeout)': (r) => r.status > 0 && r.status < 500,
    });
}
