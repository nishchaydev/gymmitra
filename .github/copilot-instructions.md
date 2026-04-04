# GymMitra ERP - Copilot Instructions

## Project Overview

GymMitra is a **multi-tenant SaaS ERP** for gym management, built with Next.js 16, Prisma, Supabase Auth, and PostgreSQL. The platform handles memberships, subscriptions, billing, inventory (POS), attendance tracking, staff management, and automated communications.

**Key Characteristics:**
- Production-ready, security-hardened (March 2026 audit completed)
- Multi-tenant with strict gym isolation via `gymId`
- Tiered SaaS plans (TRIAL, ANNUAL) with member caps enforced at database level
- Progressive Web App (PWA) with offline capabilities

---

## Build, Test, and Lint Commands

### Development
```bash
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run build            # Production build (runs prisma generate first)
npm start                # Start production server
```

### Testing
```bash
# Unit/Integration Tests (Vitest)
npm test                 # Run all Vitest tests (unit/integration)
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report
npx vitest run path/to/file.test.ts  # Run a single test file

# E2E Tests (Playwright)
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Run E2E tests with UI mode
npm run test:e2e:debug   # Debug E2E tests
npx playwright test e2e/example.spec.ts  # Run a single E2E test file
npx playwright show-report  # View HTML report after test run
```

### Linting & Formatting
```bash
npm run lint             # Run ESLint
npx prettier --write .   # Format all files (see .prettierrc)
```

### Database
```bash
npx prisma generate      # Generate Prisma Client
npx prisma migrate dev   # Apply migrations in development
npx prisma studio        # Open Prisma Studio GUI
```

### Utilities
```bash
npm run reset-gym        # Reset gym data (scripts/reset-gym.ts)
```

### Pre-commit Hook
Husky runs `npm test` automatically on commit. Tests must pass before commits are accepted.

---

## High-Level Architecture

### 1. Repository/Service Pattern

The codebase uses a **layered architecture** to separate concerns:

```
API Route → Service → Repository → Prisma
            ↓
         Validator (Zod)
```

**Module Structure** (`src/modules/*/`):
- `repository.ts` - All database operations (Prisma queries)
- `service.ts` - Business logic, validation orchestration, audit logging
- `validator.ts` - Zod schemas for input validation
- Modules: `attendance`, `billing`, `members`, `memberships`, `products`, `settings`, `shared`

**Critical Rules:**
- ✅ **DO:** Import services in API routes/actions
- ❌ **DON'T:** Import `@/lib/prisma` directly in API routes (ESLint enforces this)
- Transactions use `SERIALIZABLE` isolation to prevent race conditions (e.g., member cap checks, inventory)

**Example:**
```typescript
// ✅ Good - Use service
import { MemberService } from '@/src/modules/members/service'
await MemberService.createMember(gymId, data)

// ❌ Bad - Direct Prisma access banned in API routes
import { prisma } from '@/lib/prisma'
await prisma.member.create(...)
```

### 2. Multi-Tenancy & Data Isolation

**Every database query MUST filter by `gymId`:**
- All tables have a `gymId` foreign key with `onDelete: Cascade`
- Middleware extracts gym context from Supabase auth session
- Cross-gym data access is a **security vulnerability** (see AUDIT_REMEDIATION.md)

**Enforcement:**
```typescript
// Always scope queries to gym
prisma.member.findMany({ where: { gymId } })

// Verify ownership before operations
const member = await prisma.member.findFirst({ 
  where: { id, gymId } 
})
if (!member) throw new Error('Not found')
```

### 3. Authentication & Authorization

**Stack:** Supabase Auth + Server-Side Session Middleware

**Flow:**
1. `middleware.ts` → calls `lib/supabase/middleware.ts`
2. Validates session cookie, refreshes if needed
3. Extracts `userId` → looks up `GymProfile.userId`
4. Routes receive authenticated `gymId` in context

**Protected Routes:**
- Dashboard routes: `app/(dashboard)/*` require auth
- Public routes: `app/(public)/*`, `app/api/public/*`
- Trial blocking: Enforced in middleware (no free access after expiry)

**Helper Functions:**
- `lib/with-auth.ts` - Server action/API route auth wrapper
- `lib/with-plan.ts` - SaaS tier enforcement (member caps, feature gates)

### 4. SaaS Tiers & Member Caps

**Plans:** `TRIAL` (30 days), `ANNUAL` (unlimited duration)

**Member Limits:**
- TRIAL: 200 members max
- ANNUAL: 200 members max (enforced at create time)

**Enforcement:**
- Atomic count check inside `SERIALIZABLE` transaction (prevents TOCTOU races)
- Located in `MemberService.createMember()`

### 5. Billing & Subscriptions

**Key Models:**
- `MemberSubscription` - Links member to plan with start/end dates
- `Invoice` - Financial record with line items
- `MembershipPlan` - Plan templates (duration, price, tax)

**Critical Invariant:** Every subscription MUST have a corresponding invoice (created atomically in same transaction)

**Status Engine:**
- `src/modules/shared/status-engine.ts` - Calculates subscription status (ACTIVE, EXPIRED, EXPIRING_SOON)
- Uses `gym.timezone` for date calculations (via `date-fns-tz`)

### 6. Rate Limiting

**Stack:** Upstash Redis distributed rate limiting

**Implementation:**
- `lib/rate-limit.ts` exports `guardRateLimit()`
- Applied to: Trial creation, email sending, webhook endpoints
- Prevents abuse and SMTP overload

**Usage:**
```typescript
import { guardRateLimit } from '@/lib/rate-limit'
await guardRateLimit('trial-creation', ip, { requests: 3, window: '1h' })
```

### 7. Security Hardening (March 2026 Audit)

**Input Sanitization:**
- XSS: `escapeHtml()` in email templates, `sanitizeForPrint()` in UI
- CSV Injection: `csvEscape()` in report exports
- SQL Injection: Prevented by Prisma parameterized queries

**Headers:** Strict CSP, X-Frame-Options: DENY (see `next.config.ts`)

**HMAC Webhooks:** `crypto.timingSafeEqual()` for timing-safe comparisons

**Soft Deletes:** Queries must filter `deletedAt IS NULL` explicitly

---

## Key Conventions

### Path Aliases
```typescript
@/*  // Root directory (tsconfig.json)
```

### Import Ordering
No strict enforcement, but generally:
1. External packages
2. `@/` imports (lib, components)
3. Local relative imports

### Naming Conventions
- **Files:** kebab-case (`member-flags.ts`, `billing-calc.ts`)
- **Components:** PascalCase (`WelcomeEmail.tsx`)
- **Functions:** camelCase
- **Constants:** UPPER_SNAKE_CASE

### Code Style (Prettier)
```json
{
  "semi": false,           // No semicolons
  "singleQuote": true,     // Single quotes for strings
  "tabWidth": 2,
  "trailingComma": "all",  // Always add trailing commas
  "printWidth": 100
}
```

### Phone Number Normalization
- Strip country code (+91), leading zeros, spaces, dashes
- Store as 10-digit string
- Use `normalizePhone()` in `MemberService`

### Timezone Handling
- **NEVER** use hardcoded UTC offsets
- Always use `gym.timezone` string (default: "Asia/Kolkata")
- Use `date-fns-tz` for conversions

### Audit Logging
- Import `recordAuditLog()` from `lib/audit-logger.ts`
- Log all CREATE/UPDATE/DELETE operations on critical entities
- Include `userId`, `gymId`, `action`, `entityType`, `entityId`

### Error Handling
- Throw descriptive errors in services
- API routes catch and return appropriate HTTP status codes
- Use Zod for input validation (return 400 on schema errors)

---

## Database Schema Highlights

**Core Models:**
- `GymProfile` - Tenant root (contains settings, plan tier, timezone)
- `Member` - Gym members (unique constraint: `[gymId, phone]`)
- `MemberSubscription` - Active/expired subscriptions
- `Invoice` - Financial records with `InvoiceItem[]`
- `Product` - POS inventory items
- `Attendance` - Check-in records
- `StaffMember` - Employee accounts

**Relationships:**
- All models cascade delete when gym is deleted
- `gymId` foreign keys enforced at DB level
- Subscriptions → Members, Invoices (1:many)

**Special Fields:**
- `deletedAt` - Soft delete timestamp (must filter in queries)
- `saasPlan` / `planTier` - SaaS subscription level
- `onboardingStep` - Tracks gym setup progress (0-3)

---

## Deployment & Infrastructure

**Platform:** Vercel (optimized for Next.js)

**Environment Variables:**
```bash
DATABASE_URL           # PostgreSQL connection (Supabase/Neon)
DIRECT_URL            # Direct DB connection (bypasses pooler)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY        # Email service
UPSTASH_REDIS_REST_*  # Rate limiting
SENTRY_AUTH_TOKEN     # Error monitoring
WEBHOOK_SECRET        # Webhook HMAC verification
```

**Cron Jobs:** (IST timing, configured in `vercel.json`)
- Daily reminders: 2:30 AM IST
- Expire subscriptions: 6:30 PM IST
- Cleanup notifications: 8:30 PM Saturday IST
- Keepalive: Every 3 days

**Monitoring:**
- Sentry for error tracking (client, server, edge)
- Vercel Analytics for performance

**PWA:**
- Service worker registered in production only
- Offline sync via `lib/offlineSync.ts` + IndexedDB (`idb-keyval`)

---

## Testing Strategy

### Unit & Integration Tests (Vitest)
**Framework:** Vitest + Testing Library

**Test Locations:**
- Unit tests: Co-located with source (`*.test.ts` in same directory)
- Integration tests: `lib/__tests__/`
- Coverage: `lib/`, `components/`, `hooks/`

**Running Specific Tests:**
```bash
npx vitest run src/modules/members/service.test.ts
npx vitest run --grep "createMember"  # Run tests matching pattern
```

### E2E Tests (Playwright)
**Framework:** Playwright Test

**Test Locations:**
- E2E tests: `e2e/*.spec.ts`
- Auth fixtures: `e2e/fixtures/auth.ts`
- Test helpers: `e2e/helpers/`

**Configuration:**
- Config file: `playwright.config.ts`
- Base URL: `http://localhost:3000` (auto-starts dev server)
- Browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- Retries: 2 on CI, 0 locally
- Screenshots/videos: Only on failure

**Authenticated Tests:**
```typescript
// Use auth fixture for tests requiring login
import { test, expect } from './fixtures/auth'

test('dashboard should show members', async ({ authenticatedPage }) => {
  const { page, gymId } = authenticatedPage
  await page.goto('/dashboard/members')
  // Test authenticated flows
})
```

**Playwright MCP Server:**
The project is configured with Playwright MCP for AI-assisted E2E test generation and debugging.
See `.github/copilot-mcp.json` for MCP server configuration.

---

## Tech Debt Tracking

See `TECH_DEBT.md` for routes still using direct Prisma access (migration to repository pattern in progress).

**Priority:**
- HIGH: Business logic routes (subscriptions, renewals, reminders)
- MEDIUM: CRUD routes (staff, leads, reports)
- LOW: Infrastructure routes (cron, webhooks, health checks)

---

## Additional Resources

- **Audit Report:** `AUDIT_REMEDIATION.md` - March 2026 security review
- **System Test Checklist:** `SYSTEM_TEST_CHECKLIST.md`
- **Changelog:** `CHANGELOG.md` - Production-ready build notes
- **Antigravity Kit:** `.agent/ARCHITECTURE.md` - AI agent skills/workflows (external to codebase)
