import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Spike Test — Sudden Traffic Surge
 *
 * Simulates: A marketing campaign goes viral, gym owners flood in.
 * Goal: Verify the app recovers gracefully under sudden load.
 * Expected: Some increased latency and 429s are OK. No 500s.
 */
export const options = {
    stages: [
        { duration: '10s', target: 10 },    // Start: 10 users (warm cache)
        { duration: '30s', target: 1000 },  // SPIKE: 10 → 1000 in 30 seconds
        { duration: '3m', target: 1000 },   // Hold: 1000 users for 3 minutes
        { duration: '30s', target: 10 },    // Recovery: spike drops
        { duration: '1m', target: 10 },     // Verify: confirm recovery
        { duration: '10s', target: 0 },     // Done
    ],
    thresholds: {
        // Relaxed during a spike — we care about not crashing, not speed
        http_req_duration: ['p(99)<8000'],   // 99% under 8s (spike allowance)
        http_req_failed: ['rate<0.10'],      // Max 10% failures during spike
    },
};

const BASE_URL = 'https://gym.emitra.dev';

export default function () {
    // During a spike, hit the most common public + auth-protected pages
    // Mix of static (CDN-cacheable) and dynamic (DB-heavy) requests

    // 1. Homepage — mostly static, should handle spike easily
    const homeRes = http.get(BASE_URL, { tags: { name: 'Spike_Home' } });
    check(homeRes, {
        'spike: homepage responds': (r) => r.status === 200,
    });

    sleep(1);

    // 2. Dashboard — SSR, hits DB
    const dashRes = http.get(`${BASE_URL}/dashboard`, {
        tags: { name: 'Spike_Dashboard' },
    });
    check(dashRes, {
        'spike: dashboard responds (200 or redirect)': (r) =>
            r.status === 200 || r.status === 302 || r.status === 307,
    });

    sleep(1);

    // 3. Members API — most commonly polled endpoint
    const membersRes = http.get(`${BASE_URL}/api/members`, {
        tags: { name: 'Spike_Members' },
    });
    check(membersRes, {
        'spike: members API responds (200 or 429 or 401)': (r) =>
            r.status === 200 || r.status === 429 || r.status === 401,
    });

    sleep(2);
}
