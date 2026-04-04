# GymMitra Changelog

All notable changes to the GymMitra ERP platform will be documented in this file.

## [1.0.0-rc.2] - 2026-04-04
### ⚙️ Dashboard Stability & Performance
- **Connection Pool Optimization:** Resolved `Timed out fetching a new connection` errors by consolidating 8 top-level counts into a single high-performance Raw SQL summary query.
- **Query Batching:** Refactored 18 concurrent dashboard widget queries into a 3-wave sequential execution pattern to respect strict database connection limits.
- **Next.js Serialization:** Fixed `Decimal objects are not supported` runtime crashes by converting all financial and count fields to plain numbers before passing to Client Components.
- **Reporting Integrity:** Restored the "Overdue Payments" reminder tab and synchronized "Inactive Members" data mapping from the centralized frequency analytics.
- **Churn Logic Alignment:** Corrected SQL grouping error (`42803`) in the churn calculation query by ensuring the subquery uses correctly grouped columns.
- **Skeleton Framework (`boneyard-js`):** Integrated `boneyard-js` for automated, pixel-perfect skeleton loading across the dashboard and members modules.
- **Server-Side Compatibility:** Created `components/SkeletonProvider.tsx` Client Component wrapper to safely use `boneyard-js` in Next.js Server Components.
- **Developer Experience:** Implemented a `demo` slug auth bypass in development mode to allow the `boneyard-js` crawler to snapshot skeleton states efficiently.

### 🛡️ Multi-Tenant Integrity
- **Attendance Hardening:** Synchronized `AttendanceService` and `AttendanceRepository` to mandate explicit `gymId` scoping on all check-in lookups, eliminating unsafe global type casts.
- **Leads API Security:** Fixed a critical rate-limiting naming typo (`limter` -> `limiter`) and removed potentially unstable `(prisma as any)` hacks.

### 🎨 UI/UX Excellence
- **Selection Visibility:** Injected a global `::selection` CSS rule to fix the "invisible text" bug during user selection in `globals.css`.
- **Data Freshness:** Forced a descending sort order (`desc`) on all Outstanding Invoices to prioritize current actionable data over stale records.
- **Engagement Logic:** Expanded "Urgent Renewals" range to include members expired within the last 30 days for better re-acquisition workflows.

---

## [1.0.0-rc.1] - 2026-03-31
### 🛡️ Security & Hardening
- **Auth Hardening:** Replaced insecure plaintext temporary passwords with Supabase Magic Recovery Links during trial creation (`app/actions/trial.ts` & `app/auth/callback/route.ts`).
- **XSS & Injection Protection:** Added `escapeHtml()` sanitization recursively across all email template outputs. Applied `sanitizeForPrint()` to UI generation and restricted output `uri` schemes significantly.
- **Strict Content-Security-Policy:** Stripped `'unsafe-eval'` out of `script-src` in `next.config.ts`.
- **HMAC Signatures:** Hardened `app/api/webhooks/gym-activated/route.ts` against timing side-channel attacks by implementing SHA256 hashing pre-`crypto.timingSafeEqual` checks, and restricted the expected header strictly to `WEBHOOK_SECRET`.
- **Privacy Controls:** Masked public member check-in responses to securely return only the first name via `app/api/public/[slug]/checkin/route.ts`.

### 💾 Database & Architecture
- **Multi-Tenant Constraints:** Embedded explicit `gymId` foreign keys directly into the `MemberSubscription` and `InvoiceItem` schema definitions with `onDelete: Cascade` rules, solving orphaned data scenarios.
- **Race Condition Prevention:** Implemented database-level `$transaction` bounds and atomic comparisons (`{ stock: { gte: quantity } }`) to lock inventory states. Moved 200-member SaaS tier capping into serializable transaction scopes to prevent TOCTOU anomalies.
- **API Audit Expansion:** Handled implicit actions by broadening `lib/audit-logger.ts` native enum definitions (added `CREATE_STAFF`, `UPDATE_STAFF`, `DELETE_STAFF`, `EXPORT_DATA`).

### ⚙️ System Stability
- **Distributed Rate Limiting:** Migrated un-scalable memory maps onto generic `@upstash/redis` `guardRateLimit` functions (`app/actions/auth.ts`, `app/actions/trial.ts`).
- **Flexible Timezones:** Replaced rigid numerical (IST / `330`) minute computations with an active `gym.timezone` string resolver powered by `date-fns-tz`.
- **Cron Configuration Mapping:** Synchronized all UTC configurations in `vercel.json` flawlessly to required IST daily timelines.
- **Trial Evasion Mitigation:** Shut a bypass loophole in `lib/supabase/middleware.ts` by removing the dashboard trial-exemptions—expired access now fully redirects to the payment portal.
- **Billing Logic Integrity:** Forced Subscription and Invoice generators into synchronized single-process creation in `app/api/memberships/subscriptions/route.ts` eliminating ghost memberships.

---

*This build concludes the March 2026 forensic deep-dive security audit. Platform declared Production Ready.*
