import http from 'k6/http';
import { check, sleep } from 'k6';

// Override via: k6 run -e BASE_URL=https://emitra.dev ...
const BASE_URL = __ENV.BASE_URL || 'https://emitra.dev';
const TEST_EMAIL = __ENV.LOAD_TEST_EMAIL;
const TEST_PASSWORD = __ENV.LOAD_TEST_PASSWORD;

export const options = {
    vus: 5,
    duration: '15s',
    thresholds: {
        http_req_duration: ['p(95)<2000'],
        http_req_failed: ['rate<0.10'],
    },
};

export function setup() {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
        throw new Error('❌ LOAD_TEST_EMAIL or LOAD_TEST_PASSWORD env vars are missing!');
    }
}

export default function () {
    const loginRes = http.post(
        `${BASE_URL}/api/auth/signin`,
        JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
        {
            headers: { 'Content-Type': 'application/json' },
            redirects: 0, // Disable redirects to verify 302/303 from Supabase Auth
        }
    );

    check(loginRes, {
        'auth: status 200, 302, or 303': (r) =>
            r.status === 200 || r.status === 302 || r.status === 303,
        'auth: has session cookie or token': (r) => {
            // Use k6's cookie jar API (robust for HTTP/2)
            const jar = http.cookieJar();
            const cookies = jar.cookiesForURL(loginRes.url);
            const hasAuthCookie = Object.keys(cookies).some(name => /^sb-.*-auth-token$/.test(name));
            if (hasAuthCookie) return true;
            // Fallback: try parsing JSON body for access_token
            if (r.body) {
                try {
                    return !!r.json('access_token');
                } catch (_) {
                    return false;
                }
            }
            return false;
        },
    });

    sleep(1);

    const dashboardRes = http.get(`${BASE_URL}/dashboard`);
    check(dashboardRes, {
        'dashboard: status 200 or 302': (r) => r.status === 200 || r.status === 302,
    });

    sleep(1);
}
