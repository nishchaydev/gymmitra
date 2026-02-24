# Gym Mitra — k6 Load Testing Suite

Professional load testing for **gym.emitra.dev** targeting up to **1000 concurrent users**.

---

## Prerequisites

### 1. Install k6

**Windows (PowerShell — run as Administrator):**
```powershell
choco install k6
k6 version
```

**macOS (Homebrew):**
```bash
brew install k6
k6 version

**Linux (Debian/Ubuntu):**
```bash
sudo gpg --no-default-keyring \
  --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 \
  --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] \
  https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6
k6 version
```

### 2. Create a Test Account

Create a dedicated Supabase account with a gym profile at `gym.emitra.dev/onboarding`.

Set credentials before running:

**Windows (PowerShell):**
```powershell
$env:LOAD_TEST_EMAIL    = "loadtest@yourgym.com"
$env:LOAD_TEST_PASSWORD = "YourSecurePassword123!"
```

**macOS / Linux (bash):**
```bash
export LOAD_TEST_EMAIL="loadtest@yourgym.com"
export LOAD_TEST_PASSWORD="YourSecurePassword123!"
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

### Phase 1 — Baseline (No auth required)

**Windows:**
```powershell
# Sanity check — 10 users, 30 seconds
k6 run --vus 10 --duration 30s load-tests/api-only-test.js

# Scale up
k6 run --vus 100 --duration 1m load-tests/api-only-test.js
```

**macOS / Linux:**
```bash
k6 run --vus 10 --duration 30s load-tests/api-only-test.js
k6 run --vus 100 --duration 1m load-tests/api-only-test.js
```

### Phase 2 — Full Flow Test (~23 min)

**Windows:**
```powershell
k6 run `
  -e BASE_URL=https://gym.emitra.dev `
  -e LOAD_TEST_EMAIL=$env:LOAD_TEST_EMAIL `
  -e LOAD_TEST_PASSWORD=$env:LOAD_TEST_PASSWORD `
  load-tests/gym-owner-flow.js
```

**macOS / Linux:**
```bash
k6 run \
  -e BASE_URL=https://gym.emitra.dev \
  -e LOAD_TEST_EMAIL=$LOAD_TEST_EMAIL \
  -e LOAD_TEST_PASSWORD=$LOAD_TEST_PASSWORD \
  load-tests/gym-owner-flow.js
```

### Phase 3 — Spike Test (~5 min)

```bash
# Defaults to localhost — set BASE_URL to target production
k6 run -e BASE_URL=https://gym.emitra.dev load-tests/spike-test.js
```

### Phase 4 — Soak Test (4 hours — run overnight)

**Windows:**
```powershell
k6 run `
  -e BASE_URL=https://gym.emitra.dev `
  -e LOAD_TEST_EMAIL=$env:LOAD_TEST_EMAIL `
  -e LOAD_TEST_PASSWORD=$env:LOAD_TEST_PASSWORD `
  load-tests/soak-test.js > soak-results.txt 2>&1
```

**macOS / Linux:**
```bash
k6 run \
  -e BASE_URL=https://gym.emitra.dev \
  -e LOAD_TEST_EMAIL=$LOAD_TEST_EMAIL \
  -e LOAD_TEST_PASSWORD=$LOAD_TEST_PASSWORD \
  load-tests/soak-test.js | tee soak-results.txt
```

---

## Saving Results

Create the output directory first, then run:

**Windows:**
```powershell
New-Item -ItemType Directory -Force -Path load-tests/results
k6 run -e BASE_URL=https://gym.emitra.dev `
  -e LOAD_TEST_EMAIL=$env:LOAD_TEST_EMAIL `
  -e LOAD_TEST_PASSWORD=$env:LOAD_TEST_PASSWORD `
  --out "json=load-tests/results/run-$(Get-Date -Format 'yyyyMMdd-HHmm').json" `
  load-tests/gym-owner-flow.js
```

**macOS / Linux:**
```bash
mkdir -p load-tests/results
k6 run -e BASE_URL=https://gym.emitra.dev \
  -e LOAD_TEST_EMAIL=$LOAD_TEST_EMAIL \
  -e LOAD_TEST_PASSWORD=$LOAD_TEST_PASSWORD \
  --out "json=load-tests/results/run-$(date +%Y%m%d-%H%M).json" \
  load-tests/gym-owner-flow.js
```

---

## Rate Limit Overrides for Load Testing

The app enforces per-user rate limits (members: 100 GET/min, invoices: 20 POST/min).
At 1000 VUs sharing one test account these **will** trigger 429s — that's expected.

To increase limits for load testing **without editing source code**, set in `.env.local`:

```env
# Increase GET /api/members limit (default: 100)
LOAD_TEST_RATE_LIMIT_MEMBERS_GET=500

# Increase POST /api/members limit (default: 50)
LOAD_TEST_RATE_LIMIT_MEMBERS_POST=200
```

Then update the call in `app/api/members/route.ts`:
```typescript
import { getRateLimit } from '@/lib/rate-limit'

// Was: await apiLimiter.check(100, ...)
await apiLimiter.check(getRateLimit(100, 'MEMBERS_GET'), `${user.id}:members:get`)
```

> **Important:** Remove or reset `.env.local` overrides before deploying to production.

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
✗ invoice: status 201 or 429   ← 429s are rate limits, expected at 1000 VUs

http_req_duration..............: avg=430ms  p(95)=1.2s  p(99)=2.8s
http_req_failed................: 3.20%     ← should be < 5%
checks.........................: 94.80%    ← should be > 90%
vus............................: 1000      min=0 max=1000
```

---

## Monitoring During Tests

| Dashboard | URL | Watch For |
|-----------|-----|-----------|
| **Vercel** | vercel.com/dashboard | Error rate, function duration, bandwidth |
| **Supabase** | app.supabase.com | DB connections, query latency, pool usage |
| **Sentry** | sentry.io | Any 500 errors with stack traces |

---

## Common Issues

### 🔴 Many `429 Too Many Requests`
**Cause:** Rate limits per user. Use `LOAD_TEST_RATE_LIMIT_*` env overrides (see above).

### 🔴 Database Connection Errors
**Cause:** Supabase connection pool exhausted.
**Fix:** Ensure `DATABASE_URL` includes `?pgbouncer=true&connection_limit=10`.

### 🔴 Auth failures (all 401)
**Cause:** `LOAD_TEST_EMAIL` / `LOAD_TEST_PASSWORD` not set, or account has no gym profile.
**Fix:** Verify env vars are set. Create the gym profile at `gym.emitra.dev/onboarding`.

### 🔴 `BASE_URL` hitting localhost unintentionally
**Cause:** `spike-test.js` and `soak-test.js` default to `localhost:3000` for safety.
**Fix:** Always pass `-e BASE_URL=https://gym.emitra.dev` when targeting production.

### 🔴 High p(99) in Soak Test climbing over time
**Cause:** Memory leak or DB connection pool degradation.
**Fix:** Check Supabase connection count chart over time. Look for unclosed Prisma transactions.

---

## Post-Test Cleanup

All members and invoices created by the load test have `notes = 'k6-load-test'`.
Run this in the Supabase SQL Editor after testing:

```sql
-- Remove load test invoices first (foreign key constraint)
DELETE FROM "Invoice" WHERE notes = 'k6-load-test';
-- Then members
DELETE FROM "Member" WHERE "emergencyName" = 'Load Test Emergency';
```
