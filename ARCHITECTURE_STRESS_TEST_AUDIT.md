# GYM MITRA ERP: Architecture Stress-Test Audit Report
**Comprehensive Pre-Build Review • February 2026**

| Metric | Details |
| :--- | :--- |
| **Stack** | Next.js App Router + Supabase + Prisma + Vercel + Resend |
| **Scale Modelled** | 10,000 DAU across 500 gym tenants |
| **Verdict** | Optimised for MVP velocity — NOT 100x stability |
| 🔴 **Critical Issues** | 5 requiring immediate action before production |
| 🟡 **High Issues** | 4 requiring action before 1,000 gyms |
| **Worst-Case Risk** | End-of-month cron outage: silent data loss + double billing |

*This report consolidates all six architecture stress-test categories. Each finding includes severity, root cause, and a concrete fix. Address Critical items before writing backend code.*

---

## 1 🗄 Schema Stress Test
*10,000 DAU • 500 tenants • Prisma + PostgreSQL*

### 🔴 CRITICAL: `invoiceCounter` Race Condition
*   `GymProfile.invoiceCounter` uses a read-modify-write pattern.
*   50 simultaneous POS transactions per gym → row-level lock contention.
*   Result: duplicate invoice numbers or failed transactions under load.
**✅ Fix:**
*   Replace with a PostgreSQL native SEQUENCE scoped per gym tenant.
*   Or use a dedicated counter table with optimistic locking (version column).
*   Never use application-layer increment for financial identifiers.

### 🔴 CRITICAL: Attendance Timezone Blind Spot
*   `checkInDate` stored as String — no timezone context.
*   `@@unique([memberId, checkInDate])` breaks at UTC/IST midnight boundary.
*   Member at 11 PM UTC = 4:30 AM IST — constraint fires incorrectly.
**✅ Fix:**
*   Store `checkInTime` as DateTime WITH timezone (`timestamptz` in PostgreSQL).
*   Enforce unique daily constraint using `GymProfile.timezone` field.
*   Add `GymProfile.timezone` (e.g. 'Asia/Kolkata') used in all date math.

### 🟡 HIGH: Notification Fan-out Bottleneck
*   Cron fires 10,000 individual INSERT statements for EXPIRY_REMINDER.
*   Spikes DB CPU, exhausts connection pool, delays all other queries.
*   Month-end compounding: MONTHLY_SUMMARY + PAYMENT_OVERDUE together.
**✅ Fix:**
*   Use Prisma `createMany()` for bulk notification inserts (single round-trip).
*   Offload fan-out to Upstash QStash or AWS SQS for retry-safe delivery.
*   Cron should only enqueue jobs, never process them synchronously.

**✅ What the Schema Gets Right**
*   `@@index([gymId])` across all major tables — excellent multi-tenant query performance.
*   `Decimal(10, 2)` on all financial fields — zero floating-point risk.
*   `onDelete: Cascade` throughout — no orphaned rows on entity deletion.

---

## 2 🔐 Security Blind Spot Audit
*Supabase Auth (JWT) • Server Actions • Prisma*

### 🔴 CRITICAL: Tenant Isolation Bypass — Client-Side `gymId` Trust
*   Server Actions accepting `gymId` from frontend payload = cross-tenant data mutation.
*   Malicious user sends: `POST { gymId: 'competitor-gym-id', ... }`
*   Blast radius: full cross-tenant data read AND write.
**✅ Fix:**
*   Derive `gymId` exclusively from the server-decoded Supabase JWT — never from request body.
*   Pattern: `const { gymId } = await getServerSession()` — never `req.body.gymId`.
*   Add integration test: assert `gymId` injection returns `403 Forbidden`.

### 🔴 CRITICAL: `shareToken`: No Expiry + Low Entropy
*   `shareToken` is a `cuid()` — ~25 chars of base36, focused brute-force is feasible.
*   No expiration: leaked token exposes PII (name, address, GST, financials) forever.
*   No rate-limiting on public invoice route amplifies enumeration risk.
**✅ Fix:**
*   Replace `cuid()` with `crypto.randomBytes(32).toString('hex')` — 64 hex chars.
*   Add `shareTokenExpiresAt: DateTime` to Invoice. Default: 30 days, configurable per gym.
*   Rate-limit `/invoice/[shareToken]` to 10 req/min per IP via Vercel middleware.

### 🟡 HIGH: Improper Role Enforcement in Server Actions
*   Next.js Middleware does not auto-protect Server Actions like page routes.
*   A STAFF member can call actions intended only for TRAINER or Owner roles.
*   No centralised authorization wrapper = every action is a potential bypass point.
**✅ Fix:**
*   Create `withAuth(role)` Higher-Order Function wrapping every Server Action.
*   Pattern: `export const deleteInvoice = withAuth('OWNER')(async (gymId, id) => { ... })`
*   Log all authorization failures to a security audit table for anomaly detection.

---

## 3 🔗 Vendor Lock-In & Migration Audit
*Supabase • Vercel • Prisma • 100k users*

| Vendor | Lock-in Risk | Mitigation | Priority |
| :--- | :--- | :--- | :--- |
| **Supabase Auth** | **HIGH** — Tied to SDK. Every auth call is `supabase.auth.*` | Abstract behind `lib/auth.ts: getCurrentUser()` | Before any feature dev |
| **Supabase Storage** | **HIGH** — CDN URLs hardcoded in DB. Mass migration needed to move. | Store only relative path in DB. Build URL at app edge. | Before first upload |
| **Vercel** | **MEDIUM** — Edge Runtime + Cron both vendor-specific | Use Node runtime for Prisma. Replace Cron with QStash. | Before >200 gyms |
| **Prisma** | **LOW** — SQL migrations are standard PostgreSQL | Keep migrations vanilla SQL. No Prisma-specific extensions. | Low urgency |

---

## 4 💸 Cost Explosion Simulation
*Vercel + Supabase + Resend • DAU cost modelling*

| Cost Driver | 100 DAU | 1,000 DAU | 10,000 DAU |
| :--- | :--- | :--- | :--- |
| **DB Reads/Writes** | Low — free tier safe | Moderate — watch indexes | 🔴 **High — fan-out queries expensive** |
| **Connection Pool** | Fine on Supavisor | Monitor saturation | 🔴 **Must tune Transaction pooling mode** |
| **Vercel Functions** | Negligible | Moderate cold starts | 🔴 **Concurrent spike = timeouts** |
| **Resend Emails** | ~100/day — cheap | ~2,000/day — $10–20/mo | 🔴 **~30k/day — tier upgrade required** |
| **Storage Egress** | Negligible | Watch PDF downloads | 🔴 **Invoice PDF egress is largest spike** |

**Top Cost Reduction Actions**
*   Generate invoice PDFs client-side (`react-to-print` / `html2pdf.js`) — eliminates Storage write + egress entirely.
*   Enable Supabase Supavisor in Transaction pooling mode — prevents connection exhaustion without extra infrastructure.
*   Batch Resend calls: group birthday/expiry emails daily, not per-member, to stay within plan limits.
*   Cache public `GymProfile` data (logo, plan) at the Vercel edge — reduces DB reads ~30% at scale.

---

## 5 💥 Failure Mode Simulation
*6:00 AM spike • 50 gyms • simultaneous open*

**Failure Sequence Under Peak Load**
*   **T+0s:** 50 gyms open. 1,000 check-ins hit simultaneously. Vercel cold-starts fire across 200+ function instances.
*   **T+3s:** Supavisor connection pool saturates. Prisma throws: `Timeout fetching a connection from the pool`.
*   **T+5s:** POS transactions queue up. Two staff at same gym ring up same item — concurrent stock read race begins.
*   **T+8s:** `Product.stock` inconsistency: both reads return 10, both write 9. Sold 2 units, decremented only 1.
*   **T+10s:** `invoiceCounter` contention → two invoices issued with identical invoice numbers for same gym.
*   **T+60s:** Notification cron fires (overlaps peak). 10,000 INSERTs attempted. DB CPU 95%. Cron times out silently.

**Required Architectural Safeguards**
*   Atomic inventory decrement: `prisma.product.update({ data: { stock: { decrement: qty } } })` — never read-then-write.
*   Idempotency keys: add `idempotencyKey String @unique` to `Sale`. Hash from clientId + timestamp on frontend.
*   Cron → Queue: Vercel cron enqueues to QStash. Workers process in isolated, retry-safe 100-item batches.
*   Circuit breaker: wrap Supabase calls in retry wrapper — 3 retries at 500ms / 1s / 2s exponential backoff.
*   Alert thresholds: Supabase pool utilisation >70% (not 90%). Vercel p95 latency >800ms.

---

## 6 ✅ Completion vs. Stability Check
*Verdict: Feature-complete, not production-stable at 100x*

**Technical Debt Priority Matrix**

| Issue | Severity | Effort | Action Required |
| :--- | :--- | :--- | :--- |
| No idempotency on `Sale`/`Invoice` creation | 🔴 **Critical** | Medium | Add `idempotencyKey` + dedup logic before launch |
| `gymId` derived from client payload | 🔴 **Critical** | Low | Fix in `lib/auth.ts` before any production traffic |
| SaaS plan enforced only in UI | 🔴 **Critical** | Medium | Move plan checks to Server Action / API boundary |
| Cron runs synchronously in Next.js | 🟡 **High** | Medium | Migrate to QStash queue before >200 gyms |
| No RLS as DB-level safety net | 🟡 **High** | Med–High | Enable Supabase RLS policies as failsafe layer |
| No retry/dead-letter for Resend | 🟡 **High** | Low | Wrap Resend calls in retry queue before email scale |
| Storage URLs hardcoded in DB | 🟡 **High** | Low | Refactor to relative paths before any storage migration |
| PWA offline caches sensitive data | Medium | Medium | Exclude `/members/*` and `/invoices/*` from SW cache |

---

### ⚠️ THE WORST-CASE SCENARIO
**End-of-Month Cron + Connection Exhaustion + Silent Failure**
On the 1st of the month, the Next.js Cron Job attempts to generate 150,000 monthly invoices and send 150,000 emails. It rapidly consumes the entire Prisma connection pool — all active gyms experience database lockouts at peak morning hours. Check-ins fail. POS goes down. The cron times out after 60 seconds. 15,000 invoices were generated. 135,000 were not. There is no retry queue, no dead-letter queue, and no way to know which gyms were billed and which were skipped. Financial operations require manual database surgery.

**THE FIX:** Move ALL heavy, asynchronous, and fan-out operations off synchronous Next.js functions and into a durable message queue (Upstash QStash, RabbitMQ, or AWS SQS) before reaching 1,000 concurrent gyms.

---
*Gym Mitra ERP • Architecture Stress-Test Audit • Internal Engineering Document • February 2026*
