import http from 'k6/http';
import { check } from 'k6';

/**
 * API-Only Benchmark — Fast, No Auth
 *
 * Purpose: Quick baseline test for API response times WITHOUT the overhead
 * of authentication. Useful for measuring the raw API throughput and
 * confirming rate limits are triggered at the right threshold.
 *
 * Note: All authenticated endpoints will return 401. That's expected here.
 * We're testing the server's ability to respond (any response) at high load.
 *
 * Run time: 1 minute. Use as a quick pre-test sanity check.
 *
 * Usage:
 *   k6 run load-tests/api-only-test.js
 */
export const options = {
    vus: 1000,
    duration: '1m',
    thresholds: {
        http_req_duration: ['p(95)<800'],    // Unauthenticated 401 should be fast
        http_req_failed: ['rate<0.01'],       // No network failures allowed
    },
};

const BASE_URL = 'https://gym.emitra.dev';

// Round-robin through endpoints to distribute load
const ENDPOINTS = [
    { url: `${BASE_URL}/api/members`, tag: 'API_Members' },
    { url: `${BASE_URL}/api/invoices`, tag: 'API_Invoices' },
    { url: `${BASE_URL}/api/products`, tag: 'API_Products' },
    { url: `${BASE_URL}/api/reports?type=summary`, tag: 'API_Reports' },
    { url: `${BASE_URL}/dashboard`, tag: 'API_Dashboard' },
];

export default function () {
    // Pick an endpoint based on VU ID for even distribution
    const endpoint = ENDPOINTS[__VU % ENDPOINTS.length];

    const res = http.get(endpoint.url, {
        tags: { name: endpoint.tag },
    });

    check(res, {
        // All of these are valid: server responded (not timed out / crashed)
        'server responded': (r) =>
            r.status === 200 || r.status === 401 || r.status === 429,
        'no 500 errors': (r) => r.status < 500,
        'response under 800ms': (r) => r.timings.duration < 800,
    });
}
