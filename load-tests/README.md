# Gym Mitra — k6 Load Testing Suite

Professional load testing for **gym.emitra.dev** targeting up to **1000 concurrent users**.

---

## Prerequisites

### 1. Install k6

```powershell
# Windows (Chocolatey)
choco install k6

# Verify
k6 version
```

### 2. Create a Test Account in Supabase

The main flow test requires a real Supabase account with a gym profile set up.

1. Go to `gym.emitra.dev/onboarding` and create a dedicated test account
2. Set env vars before running:

```powershell
$env:LOAD_TEST_EMAIL = "loadtest@yourgym.com"
$env:LOAD_TEST_PASSWORD = "YourSecurePassword123!"
```

---

## Test Files

| File | Type | Peak Load | Duration |
|------|------|-----------|----------|
| `gym-owner-flow.js` | Realistic Journey | 1000 VUs | ~23 min |
| `spike-test.js` | Stress / Spike | 1000 VUs | ~5 min |
| `soak-test.js` | Stability | 100 VUs | 4+ hours |
| `api-only-test.js` | API Benchmark | 1000 VUs | 1 min |

---

## Quick Start (Follow This Order)

### Phase 1 — Baseline (Start Here!)

```powershell
# Warm-up: 10 users for 30 seconds (safe, quick sanity check)
k6 run --vus 10 --duration 30s load-tests/api-only-test.js

# If that's green, try 100 users
k6 run --vus 100 --duration 1m load-tests/api-only-test.js
```

### Phase 2 — Full Flow Test

```powershell
# Gradual ramp: 0 → 100 → 500 → 1000 users (~23 min)
k6 run `
  -e LOAD_TEST_EMAIL=loadtest@yourgym.com `
  -e LOAD_TEST_PASSWORD=YourPassword123! `
  load-tests/gym-owner-flow.js
```

### Phase 3 — Spike Test

```powershell
# Sudden traffic surge: 0 → 1000 in 30 seconds
k6 run load-tests/spike-test.js
```

### Phase 4 — Soak Test (Optional, run overnight)

```powershell
# 100 users for 4 hours — detects memory leaks
k6 run `
  -e LOAD_TEST_EMAIL=loadtest@yourgym.com `
  -e LOAD_TEST_PASSWORD=YourPassword123! `
  load-tests/soak-test.js > soak-results.txt 2>&1
```

---

## Saving Results

```powershell
# Save as JSON for analysis
k6 run --out json=results/run-$(Get-Date -Format 'yyyyMMdd-HHmm').json load-tests/gym-owner-flow.js
```

---

## What Each Test Covers

### `gym-owner-flow.js` — Full User Journey

Simulates a gym owner's typical session:

1. **Login** via Supabase auth (cookie-based session)
2. **Dashboard** — SSR page with analytics
3. **Members List** — `GET /api/members` (rate limit: 100 req/min)
4. **Invoices List** — `GET /api/invoices` (rate limit: 100 req/min)
5. **Create Member** — `POST /api/members` (rate limit: 50 req/min) — unique phone per VU to avoid conflicts
6. **Create Invoice** — `POST /api/invoices` (rate limit: 20 req/min) — 429s expected at peak, not counted as errors
7. **Report Summary** — `GET /api/reports?type=summary` — 5 parallel DB queries
8. **Report Revenue** — `GET /api/reports?type=revenue` — raw SQL aggregation
9. **Products List** — `GET /api/products`

**Load Pattern:**

```
Users
1000 ┤                    ████████████
 500 ┤         ████████████
 100 ┤ ████████
   0 ┤                                ──
     0    5    10   15   20   23 min
```

### `spike-test.js` — Traffic Surge

Tests resilience when 1000 users hit simultaneously. Covers: homepage, dashboard, and members API. Relaxed thresholds — the goal is **no crashes**, not speed.

### `soak-test.js` — Stability Over Time

Runs 100 users for 4 hours, randomly cycling through all endpoints. Watch for **response time degradation** — if p95 climbs over time, there's a memory leak or DB connection pool issue.

### `api-only-test.js` — Raw Throughput Benchmark

1000 VUs hitting all endpoints **without auth** for 1 minute. All 401s are expected and counted as successes. Only 500s and timeouts are failures. Great for a quick "is the server alive?" check.

---

## Success Criteria

| Metric | Target |
|--------|--------|
| `http_req_duration` p(95) | < 2000ms |
| `http_req_duration` p(99) | < 4000ms |
| `http_req_failed` rate | < 5% |
| Dashboard p(95) | < 3000ms |
| Members list p(95) | < 1500ms |
| Reports summary p(95) | < 4000ms |
| HTTP 500 errors | Zero |

---

## Reading k6 Output

```
✓ members: status 200
✓ add member: status 201
✗ invoice: status 201 or 429  ← 429s are rate limits, expected at 1000 VUs

http_req_duration..............: avg=430ms  p(95)=1.2s  p(99)=2.8s
http_req_failed................: 3.20%   ← this should be < 5%
checks.........................: 94.80%  ← should be > 90%
vus............................: 1000    min=0 max=1000
```

**Green flags ✅**
- `p(95)` under thresholds
- `http_req_failed < 5%`
- Zero `status === 500` responses

**Red flags 🚨**
- `p(99)` climbing over time (soak test) → memory leak
- Many `status === 500` → server crash, check Sentry
- Many `status === 503` → Supabase connection pool exhausted

---

## Monitoring During Tests

Keep these dashboards open while k6 runs:

| Dashboard | URL | Watch For |
|-----------|-----|-----------|
| **Vercel** | vercel.com/dashboard | Error rate, function duration, bandwidth |
| **Supabase** | app.supabase.com → your project | DB connections, query latency |
| **Sentry** | sentry.io | Any 500 errors with stack traces |

---

## Common Issues & Fixes

### 🔴 Many `429 Too Many Requests`

**Cause:** Rate limits in `/api/members`, `/api/invoices` etc.

The rate limits are per-user, so 1000 VUs sharing one test account will hit them fast.

**Fix for testing:** Use multiple test accounts, or temporarily increase limits in `lib/rate-limit.ts`:
```typescript
// Temporarily for load testing only
await apiLimiter.check(500, `${user.id}:members:get`) // was 100
```

### 🔴 Database Connection Errors

**Cause:** Supabase free tier has a connection pool limit.

**Fix:** Ensure `DATABASE_URL` in `.env` uses PgBouncer:
```
DATABASE_URL="postgres://...?pgbouncer=true&connection_limit=10"
```

### 🔴 Auth Failures (all 401)

**Cause:** Test account not set up, or cookie session not persisted by k6.

**Fix:** Verify `LOAD_TEST_EMAIL` env var is set. k6 does handle cookies automatically per VU — each VU gets its own cookie jar.

### 🔴 High p(99) in Soak Test

**Cause:** Memory leak or DB connection pool degradation.

**Fix:** Check Supabase for connection count over time. Look for unclosed Prisma transactions in server logs.
