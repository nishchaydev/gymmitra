# GymMitra: Pre-Launch / Go-Live Checklist

> **Verified against codebase on 25 Feb 2026.** Each item was audited against the actual source code. Updated with hardening fixes.

---

## 🟢 Critical / Blockers (All Resolved)

### 1. Multi-Tenant Data Security (Cross-Tenant Leakage)
- **Status**: ✅ **FIXED — RLS enabled + Application-level filtering**
- **Evidence**: All 17 API routes consistently use `gymId: auth.gym.id` or `gymId: gym.id` in their Prisma `where` clauses. **RLS is enabled on all 12 tables** (`rowsecurity: true` verified via SQL query).
- **Defense in Depth**: Application-level `gymId` filtering + Supabase RLS active on all tables.
- **Remaining Action**: Consider adding a Prisma Client Extension to auto-inject `gymId` into all queries for multi-tenant models.

---

### 2. Concurrency & Race Conditions
- **Status**: ✅ **FIXED — Serializable transactions**
- **Evidence**: Both schedule routes (`app/api/schedule/route.ts` POST, `app/api/schedule/[id]/route.ts` PATCH) now use `withRetry(() => prisma.$transaction(..., { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }))` to prevent serialization failures (P2034) by automatically retrying with exponential backoff.
- **Also**: `app/api/memberships/subscriptions/route.ts` updated with `withRetry` and `$transaction`.
- **Distributed Locking**: For high-contention scenarios (e.g., flash sales), add Upstash Redis advisory locks with:
  - `SET NX` with `PX` (TTL) to prevent indefinite holds
  - Unique lock value + compare-and-delete via Lua to avoid accidental releases
  - TTL renewal only if still owner
  - Exponential backoff retries + fallback/alert if acquisition repeatedly fails

---

### 3. Automated Cron Jobs & Reminders
- **Status**: ✅ **FIXED — Vercel Cron + Resend email**
- **Evidence**: `vercel.json` configured with daily cron at `30 3 * * *` (3:30 AM UTC = 9:00 AM IST). Route `/api/cron/daily-reminders` sends expiry, overdue, and birthday emails via Resend.
- **Security**: CRON_SECRET validated via `crypto.timingSafeEqual` (constant-time comparison). Missing/invalid tokens rejected with 401 before any processing.
- **Scalability**: Emails sent in concurrency-limited batches (5 at a time) via `Promise.allSettled`. Birthday members queried via DB-level `EXTRACT(MONTH/DAY)` instead of in-memory filtering.
- **Remaining Action**: For very large deployments, consider delegating per-gym work to Upstash QStash so each job is short-lived and the cron only fan-outs.

---

## 🟡 High Priority (Recommended for Launch)

### 4. Automated Payment Integration
- **Status**: ❌ **Not implemented — Fully manual**
- **Evidence**: Zero payment gateway code. The `PaymentMethod` enum only supports `CASH`, `CARD`, `UPI`, `OTHER` — all manually recorded.
- **Action**: Integrate Razorpay (best fit for Indian market) with:
  - Webhook-based payment confirmation to auto-update `Invoice.paymentStatus`
  - **Webhook signature verification**: The webhook endpoint MUST validate the `X-Razorpay-Signature` header using HMAC-SHA256 with your Razorpay webhook secret before updating any records
  - Log/ignore requests with invalid signatures or malformed payloads

---

### 5. Error Tracking & Monitoring
- **Status**: ✅ **VERIFIED — Fully configured**
- **Evidence**: Sentry is properly wired across all three runtimes (client, server, edge) with source map upload and Session Replay.
- **Remaining Action**: Verify source maps upload correctly and configure alert rules for error spikes.

---

### 6. Rate Limiting Coverage
- **Status**: ✅ **FIXED — All 17 routes protected**
- **Evidence**: All routes now use the centralized `guardRateLimit()` helper from `lib/rate-limit.ts` which provides:
  - ✅ **Retry-After headers** on all 429 responses (from `RateLimitError.retryAfter`)
  - ✅ **Per-user keys** (`auth.userId` instead of `gym.id`) to prevent one user exhausting gym-wide quota
  - ✅ **Fail-open** on limiter infrastructure errors (Redis down → request proceeds with warning log)
  - ✅ **Reduced limits for destructive ops**: DELETE (10), PUT (30), POST (20-50), GET (100)
- **Webhook routes**: `/api/webhooks/onboarding` uses IP-based rate limiting (10/min) with proper X-Forwarded-For parsing and HMAC signature verification.

---

### 7. Breach Notification & Data Privacy (DPDP Act)
- **Status**: ⚠️ **Not yet addressed**
- **Evidence**: Member PII (phone, DOB, emergency contacts) stored in plaintext. No deletion/anonymization API. No DPA offered.
- **Action Required**:
  - 🟡 **Breach Notification (High)**: Create an incident-response runbook. Integrate automated alerting (e.g., Sentry + PagerDuty). Notification to Data Protection Board required within 72 hours (once DPDP Act rules are officially enforced), and to CERT-In within 6 hours of discovery.
  - 🟡 **Consent Notice & Withdrawal (High)**: In-app consent capture that is free/specific/informed/unambiguous. Equally simple withdrawal flow.
  - 🔵 **Child Data / Parental Consent**: Age-gate and verifiable parental-consent flow for underage members.
  - 🔵 **Data Export/Deletion**: Add member data export and deletion API endpoints.
  - 🔵 **Field-Level Encryption**: Consider encrypting sensitive columns (phone, emergency contacts, DOB).
  - Add a privacy policy page (already have `/legal/service-agreement`).

---

## 🔵 Medium Priority (Fast Follows / Post-Launch)

### 8. Analytics & Advanced Reporting
- **Status**: ⚠️ **Basic only**
- **Evidence**: Reports provide current-state snapshots. Raw SQL queries for monthly trends exist but lack cohort-based retention analysis.
- **Action**: Add retention rate tracking and surface it in the dashboard.

---

## ✅ Summary Scorecard

| # | Item | Status | Severity |
|---|------|--------|----------|
| 1 | Multi-Tenant Isolation | ✅ RLS + App-level | ✅ Done |
| 2 | Concurrency / Race Conditions | ✅ Serializable tx | ✅ Done |
| 3 | Automated Cron / Reminders | ✅ Vercel Cron + Resend | ✅ Done |
| 4 | Payment Gateway | ❌ Not implemented | 🟡 High |
| 5 | Error Tracking (Sentry) | ✅ Fully configured | ✅ Done |
| 6 | Rate Limiting | ✅ 17/17 routes + Retry-After | ✅ Done |
| 7 | Data Privacy / DPDP | ⚠️ Not addressed | 🟡 High |
| 8 | Advanced Analytics | ⚠️ Basic only | 🔵 Medium |

**Launch Readiness: 5/8 items fully resolved. 0 critical blockers remain. 2 high-priority items remain (Payment Gateway, DPDP compliance).**
