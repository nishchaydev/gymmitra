import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend } from 'k6/metrics';

/**
 * Soak Test — Long-Duration Stability Test
 *
 * Simulates: 100 real gym owners using the app continuously for 4 hours.
 * Goal: Detect memory leaks, DB connection exhaustion, slow degradation.
 * Watch: Response times should NOT increase over time. If p95 climbs
 *        from 200ms at hour 1 to 800ms at hour 4 → memory leak / pool issue.
 *
 * Run this overnight (or during low-traffic period).
 * Recommended: k6 run load-tests/soak-test.js > soak-results.txt 2>&1
 */
export const options = {
    stages: [
        { duration: '5m', target: 100 },   // Ramp up to 100 users
        { duration: '4h', target: 100 },   // SOAK: hold for 4 hours
        { duration: '5m', target: 0 },     // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<1500'],   // Should NOT degrade over time
        http_req_failed: ['rate<0.02'],       // Under 2% error rate
    },
};

const BASE_URL = 'https://gym.emitra.dev';

// Trend to track if response times degrade over duration
const responseTimeTrend = new Trend('soak_response_time');

export default function () {
    // Simulate randomised usage — not all users do the same thing at once
    const rand = Math.random();

    if (rand < 0.4) {
        // 40%: Most common — view members list
        const res = http.get(`${BASE_URL}/api/members`, {
            tags: { name: 'Soak_Members' },
        });
        responseTimeTrend.add(res.timings.duration);
        check(res, {
            'soak: members stable': (r) => r.status === 200 || r.status === 401,
        });

    } else if (rand < 0.65) {
        // 25%: View invoices
        const res = http.get(`${BASE_URL}/api/invoices`, {
            tags: { name: 'Soak_Invoices' },
        });
        responseTimeTrend.add(res.timings.duration);
        check(res, {
            'soak: invoices stable': (r) => r.status === 200 || r.status === 401,
        });

    } else if (rand < 0.80) {
        // 15%: View dashboard (SSR + DB)
        const res = http.get(`${BASE_URL}/dashboard`, {
            tags: { name: 'Soak_Dashboard' },
        });
        responseTimeTrend.add(res.timings.duration);
        check(res, {
            'soak: dashboard stable': (r) =>
                r.status === 200 || r.status === 302 || r.status === 307,
        });

    } else if (rand < 0.90) {
        // 10%: Reports summary (most DB-intensive)
        const res = http.get(`${BASE_URL}/api/reports?type=summary`, {
            tags: { name: 'Soak_Reports' },
        });
        responseTimeTrend.add(res.timings.duration);
        check(res, {
            'soak: reports stable': (r) => r.status === 200 || r.status === 401,
        });

    } else {
        // 10%: Products list
        const res = http.get(`${BASE_URL}/api/products`, {
            tags: { name: 'Soak_Products' },
        });
        responseTimeTrend.add(res.timings.duration);
        check(res, {
            'soak: products stable': (r) => r.status === 200 || r.status === 401,
        });
    }

    // Realistic think time: 5–15 seconds between requests
    sleep(5 + Math.random() * 10);
}
