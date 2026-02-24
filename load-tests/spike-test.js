import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Spike Test — Sudden Traffic Surge
 *
 * Goal: Verify the app handles a viral-traffic spike gracefully.
 * Some 429s are acceptable. A small percentage of unexpected errors (< 20%
 * global) is tolerated during extreme load. Zero unrecovered crashes.
 *
 * Run against production:
 *   k6 run -e BASE_URL=https://gym.emitra.dev load-tests/spike-test.js
 *
 * Run against staging (default when no env var is set):
 *   k6 run load-tests/spike-test.js
 */

// --- Target Environment ---
// Defaults to non-production so running k6 with no args won't hit prod.
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Module-scope constant — built once, not on every VU iteration
const REQUEST_TIMEOUT = '12s'; // Release stuck VUs promptly under extreme load

function makeParams(name) {
    return { tags: { name }, timeout: REQUEST_TIMEOUT };
}

// Mark 401 and 429 as non-failing statuses for unauthenticated/rate-limited calls
const expectedStatuses = http.expectedStatuses({ min: 200, max: 399 }, 401, 429);

export const options = {
    stages: [
        { duration: '10s', target: 10 },    // Warm cache
        { duration: '30s', target: 1000 },  // SPIKE: 10 → 1000 in 30 seconds
        { duration: '3m', target: 1000 },   // Hold at peak
        { duration: '30s', target: 10 },    // Drop back
        { duration: '1m', target: 10 },     // Verify recovery
        { duration: '10s', target: 0 },
    ],
    thresholds: {
        // Relaxed during a spike — survival, not speed
        http_req_duration: ['p(99)<8000'],
        // Global catch-all: caps total failure rate across all endpoints
        http_req_failed: ['rate<0.20'],
        // Per-endpoint budgets — tighter for more stable routes
        'http_req_failed{name:Spike_Home}': ['rate<0.05'],
        'http_req_failed{name:Spike_Dashboard}': ['rate<0.10'],
        'http_req_failed{name:Spike_Members}': ['rate<0.15'],
    },
};

export default function () {
    // 1. Homepage — mostly CDN-cached; should handle spike easily
    const homeRes = http.get(BASE_URL, {
        ...makeParams('Spike_Home'),
        responseCallback: expectedStatuses,
    });
    check(homeRes, {
        'spike: homepage responds': (r) => r.status === 200,
    });

    sleep(1);

    // 2. Dashboard — SSR + DB; may redirect unauthenticated users; 429 OK during spike
    const dashRes = http.get(`${BASE_URL}/dashboard`, {
        ...makeParams('Spike_Dashboard'),
        responseCallback: expectedStatuses,
    });
    check(dashRes, {
        'spike: dashboard responds (200, redirect, or 429)': (r) =>
            r.status === 200 || r.status === 302 || r.status === 307 || r.status === 429,
    });

    sleep(1);

    // 3. Members API — most commonly polled endpoint; 401/429 are expected
    const membersRes = http.get(`${BASE_URL}/api/members`, {
        ...makeParams('Spike_Members'),
        responseCallback: expectedStatuses,
    });
    check(membersRes, {
        'spike: members API responds (200, 401, or 429)': (r) =>
            r.status === 200 || r.status === 401 || r.status === 429,
    });

    sleep(2);
}
