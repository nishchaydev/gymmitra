# GymMitra Changelog

All notable changes to the GymMitra ERP platform will be documented in this file.

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
