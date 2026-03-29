# Tech Debt — Routes with Direct Prisma Access

> **Context**: Phase 1 of the system hardening refactored the core 6 modules to use the repository pattern.
> These remaining routes still use direct `prisma.*` calls and should be migrated in future passes.

## Priority: HIGH (Business Logic Routes)
These routes contain business logic that should be in a service layer.

| Route | Current State | Future Module |
|---|---|---|
| `app/api/memberships/subscriptions/route.ts` | Direct prisma in POST handler | `memberships` service |
| `app/api/memberships/plans/route.ts` | Direct prisma for CRUD | `memberships` service |
| `app/api/memberships/plans/[id]/route.ts` | Direct prisma for update/delete | `memberships` service |
| `app/api/renewals/route.ts` | Direct prisma for renewal logic | `renewals` service |
| `app/api/reminders/route.ts` | Direct prisma for reminder queries | `reminders` service |

## Priority: MEDIUM (CRUD Routes)
Simple CRUD with no complex business logic, but should still follow the pattern.

| Route | Current State | Future Module |
|---|---|---|
| `app/api/staff/route.ts` | Direct prisma for staff CRUD | `staff` module |
| `app/api/staff/[id]/route.ts` | Direct prisma for staff update/delete | `staff` module |
| `app/api/leads/route.ts` | Direct prisma for lead CRUD | `leads` module |
| `app/api/leads/[id]/route.ts` | Direct prisma for lead update/delete | `leads` module |
| `app/api/reports/route.ts` | Direct prisma for report queries | `reports` module |
| `app/api/reports/download/route.ts` | Direct prisma for export | `reports` module |
| `app/api/members/at-risk/route.ts` | Direct prisma for at-risk queries | `members` service extension |

## Priority: LOW (Infrastructure Routes)
Operational routes — lower risk, can be addressed later.

| Route | Current State | Notes |
|---|---|---|
| `app/api/public/[slug]/checkin/route.ts` | Direct prisma | Should use AttendanceService |
| `app/api/cron/expire-subscriptions/route.ts` | Direct prisma | Cron infrastructure |
| `app/api/cron/daily-reminders/route.ts` | Direct prisma | Cron infrastructure |
| `app/api/cron/cleanup-notifications/route.ts` | Direct prisma | Cron infrastructure |
| `app/api/cron/keepalive/route.ts` | Direct prisma | Health/heartbeat |
| `app/api/webhooks/onboarding/route.ts` | Direct prisma | Webhook handler |
| `app/api/webhooks/gym-activated/route.ts` | Direct prisma | Webhook handler |
| `app/api/onboarding/check-email/route.ts` | Direct prisma | Onboarding flow |
| `app/api/onboarding/check-phone/route.ts` | Direct prisma | Onboarding flow |
| `app/api/health/route.ts` | Direct prisma | Health check |
| `app/api/auth/sync-cookie/route.ts` | Direct prisma | Auth infrastructure |

## Migration Pattern
When migrating a route, follow this pattern:

1. Create `src/modules/{module}/repository.ts` with all DB operations
2. Create `src/modules/{module}/service.ts` with business logic
3. Create `src/modules/{module}/validator.ts` with Zod schemas
4. Update the API route to call service → repository (no direct prisma)
5. Add types to `src/modules/shared/schemas.ts` barrel export
6. Verify: `grep -r "import { prisma }" src/modules/{module}/service.ts` should return 0 results
