# GymMitra: Pre-Launch / Go-Live Checklist

> **Verified against codebase on 25 Feb 2026.** Each item was audited against the actual source code.

---

## 🔴 Critical / Blockers (Must Fix Before Launch)

### 1. Multi-Tenant Data Security (Cross-Tenant Leakage)
- **Status**: ⚠️ **CONFIRMED — Application-level only**
- **Evidence**: All 17 API routes in `app/api/` consistently use `gymId: auth.gym.id` or `gymId: gym.id` in their Prisma `where` clauses. This is good — **no route was found missing the filter**. However, there is **zero database-level enforcement** (no RLS policies, no `vercel.json`, no Supabase RLS).
- **Risk**: A single new route added by a developer without the `gymId` filter would silently leak data across gyms.
- **Action**:
  - **Option A (Recommended)**: Add a Prisma Client Extension that auto-injects `gymId` into all queries for multi-tenant models.
  - **Option B**: Enable Supabase Row Level Security (RLS) at the database level.

---

### 2. Concurrency & Race Conditions
- **Status**: ⚠️ **CONFIRMED — Partially addressed**
- **Evidence**: Only **2 out of 17 routes** use `prisma.$transaction()`:
  - ✅ `app/invoices/actions.ts` (invoice creation)
  - ✅ `app/api/memberships/subscriptions/route.ts` (subscription creation)
- **Unprotected critical paths**:
  - ❌ `app/api/schedule/route.ts` — PT session booking has **no transaction or lock**. Two simultaneous requests could double-book the same trainer at the same time slot.
  - ❌ `app/api/products/route.ts` — Stock decrement on sales has no atomic guard.
- **Action**: Wrap PT session booking and product stock mutations in `$transaction` blocks. For high-contention scenarios, add distributed locking via Upstash Redis (already installed).

---

### 3. Automated Cron Jobs & Reminders
- **Status**: ❌ **CONFIRMED — No automation exists**
- **Evidence**:
  - The `app/api/reminders/route.ts` endpoint **exists and works correctly** — it fetches birthdays, overdue invoices, inactive members, and expiring subscriptions.
  - However, it is a **manual-trigger GET endpoint** that only runs when a gym owner opens the reminders page.
  - **No `vercel.json`** file exists in the project (so no Vercel Cron Jobs are configured).
  - No `node-cron`, `bullmq`, Inngest, or Trigger.dev dependencies found.
- **Action**: Create a `vercel.json` with a cron schedule pointing to a new API route (e.g., `/api/cron/daily-reminders`) that iterates over all gyms and sends automated notifications via email (Resend is already installed).

---

## 🟡 High Priority (Recommended for Launch)

### 4. Automated Payment Integration
- **Status**: ❌ **CONFIRMED — Fully manual**
- **Evidence**: Zero payment gateway code (no Razorpay, Stripe, Cashfree, or PayU). The `PaymentMethod` enum only supports `CASH`, `CARD`, `UPI`, `OTHER` — all manually recorded by the gym owner.
- **Action**: Integrate Razorpay (best fit for Indian market) with webhook-based payment confirmation to auto-update `Invoice.paymentStatus`.

---

### 5. Error Tracking & Monitoring
- **Status**: ✅ **VERIFIED — Fully configured**
- **Evidence**: Sentry is properly wired across all three runtimes:
  - `sentry.client.config.ts` — Client-side with **Session Replay** enabled
  - `sentry.server.config.ts` — Server-side with configurable trace sample rate
  - `sentry.edge.config.ts` — Edge runtime
  - `next.config.ts` — Wrapped with `withSentryConfig()` and source map upload via `SENTRY_AUTH_TOKEN`
- **Remaining Action**: Verify in Sentry dashboard that source maps are uploading correctly and alerts are configured for error spikes.

---

### 6. Rate Limiting Coverage
- **Status**: ⚠️ **PARTIALLY IMPLEMENTED — Major gaps**
- **Evidence**: Rate limiting (via `@upstash/ratelimit`) is applied to only **4 out of 17 API routes**:
  - ✅ `/api/attendance` — Custom rate limit function
  - ✅ `/api/members` — `apiLimiter`
  - ✅ `/api/products` — `apiLimiter`
  - ✅ `/api/invoices` — `apiLimiter`
- **Unprotected routes (13 total)**:
  - ❌ `/api/memberships/plans`
  - ❌ `/api/memberships/subscriptions`
  - ❌ `/api/products/[id]`
  - ❌ `/api/members/[id]`
  - ❌ `/api/reminders`
  - ❌ `/api/reports`
  - ❌ `/api/schedule` + `/api/schedule/[id]`
  - ❌ `/api/settings`
  - ❌ `/api/staff` + `/api/staff/[id]`
  - ❌ `/api/attendance/sync-offline`
  - ❌ `/api/webhooks/onboarding`
- **Action**: Add `apiLimiter.check()` to all unprotected routes. Particularly critical for `/api/webhooks/onboarding` (public-facing) and `/api/reports` (expensive queries).

---

## 🔵 Medium Priority (Fast Follows / Post-Launch)

### 7. Data Privacy & Compliance (DPDP Act)
- **Status**: ⚠️ **Not yet addressed**
- **Evidence**: Member PII (phone, DOB, emergency contacts) is stored in plaintext. No "Delete My Data" or account anonymization functionality exists. No Data Processing Agreement (DPA) is offered to gyms.
- **Action**: Add a member data export/deletion API. Add a privacy policy page (you already have `/legal/service-agreement`). Consider field-level encryption for sensitive columns.

---

### 8. Analytics & Advanced Reporting
- **Status**: ⚠️ **Basic only**
- **Evidence**: `Reports.tsx` and `/api/reports/route.ts` provide current-state snapshots (revenue, member counts, attendance trends). Raw SQL queries for monthly trends exist but lack cohort-based retention analysis.
- **Action**: Add retention rate tracking (e.g., "What % of members from 3 months ago are still active?") and surface it in the dashboard.

---

## ✅ Summary Scorecard

| # | Item | Status | Severity |
|---|------|--------|----------|
| 1 | Multi-Tenant Isolation | ⚠️ App-level only (no RLS) | 🔴 Critical |
| 2 | Concurrency / Race Conditions | ⚠️ 2/17 routes protected | 🔴 Critical |
| 3 | Automated Cron / Reminders | ❌ Manual only | 🔴 Critical |
| 4 | Payment Gateway | ❌ Not implemented | 🟡 High |
| 5 | Error Tracking (Sentry) | ✅ Fully configured | ✅ Done |
| 6 | Rate Limiting | ⚠️ 4/17 routes only | 🟡 High |
| 7 | Data Privacy / DPDP | ⚠️ Not addressed | 🔵 Medium |
| 8 | Advanced Analytics | ⚠️ Basic only | 🔵 Medium |

**Launch Readiness: 1/8 items fully clear. 3 critical blockers remain.**
