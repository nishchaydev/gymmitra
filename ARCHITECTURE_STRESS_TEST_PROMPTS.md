# GYM MITRA ERP: Architecture Stress-Test Prompt Pack
**Pre-Backend Build Review • February 2026**

This document contains all six architecture stress-test prompts pre-filled with the Gym Mitra ERP system details. Paste each prompt into your AI model one at a time, question the answers, and refine until the system logic is crystal clear before writing a single line of backend code.

## How to Use This Document
*   Replace any remaining `[PLACEHOLDERS]` if context evolves
*   Paste one prompt at a time into your AI model (e.g., Claude Opus, GPT-4o)
*   Do NOT accept the first answer blindly — ask aggressive follow-ups
*   Ask: "What would break at scale?" after every positive response
*   Refine until system logic is unambiguous before writing backend code

---

## 1. 🗄 Schema Stress Test

**Purpose**
Design a bulletproof database structure before wiring anything to the frontend. Validate normalization, indexing strategy, and write-amplification risk across all eight core modules.

**Filled Prompt — Copy & Paste Below:**

```text
You are a senior backend architect.

Here is my app: Gym Mitra ERP — a multi-tenant SaaS platform for gym
owners. Stack: Next.js App Router + TypeScript + Supabase (Auth, Storage,
PostgreSQL) + Prisma ORM + Vercel hosting + Resend for transactional email.

FEATURE LIST:
  • Multi-tenant isolation via gymId FK on every major table
  • Member lifecycle: personal info, emergency contacts, MemberStatus enum
  • Membership plans & subscriptions with autoRenew + PaymentStatus
  • Inventory (Product: stock, categories PROTEIN/SUPPLEMENT) + POS (Sale)
  • Invoice engine: shareToken for public PDF, InvoiceItem line items, GST
  • Attendance: unique constraint [memberId, checkInDate]
  • Staff & Trainer roles; PTSession unique [trainerId, startTime]
  • Notifications: BIRTHDAY, EXPIRY_REMINDER, PAYMENT_OVERDUE, LOW_STOCK,
    MONTHLY_SUMMARY — driven by cron jobs

STEP 1:
Review the schema design. Identify any denormalization, missing indexes,
or FK gaps. Specifically check: Does gymId indexing cover all query paths?
Are Decimal(10,2) fields consistent for all financial columns?
Is the Attendance unique constraint sufficient for timezone-aware gyms?

STEP 2:
Simulate 10,000 daily active users across 500 gym tenants.
Identify: structural weaknesses, write amplification hotspots (e.g., invoice
counter increment), bottlenecks in the Notification fan-out, and any risk of
gymId index bloat with high tenant counts.

STEP 3:
Suggest schema improvements for scale. Be brutally honest.
Optimize for long-term stability, not MVP simplicity.
```

**Key Specifics to Probe:**
*   **invoiceCounter increment:** is it safe under concurrent writes? Suggest row-level locking or sequence alternatives.
*   **Attendance timezone gap:** checkInDate is date-only — what breaks for gyms in IST vs UTC midnight boundary?
*   **shareToken on Invoice:** is it truly unguessable? How long should it be and should it expire?
*   **GymProfile.saaSPlan:** does plan enforcement happen at DB level, middleware, or only UI?

---

## 2. 🔐 Security Blind Spot Audit

**Purpose**
Surface authentication bypass risks, improper role enforcement, injection vectors, and client-side trust issues before they become production incidents.

**Filled Prompt — Copy & Paste Below:**

```text
You are a backend security engineer.

ARCHITECTURE: Multi-tenant SaaS. Supabase Auth (JWT). Next.js App Router
with Server Actions + API routes. Prisma ORM on PostgreSQL (Supabase).
Vercel edge deployment. Resend for email. PWA with offline capability.

FEATURE SET:
  • Role system: STAFF vs TRAINER (StaffMember.role). Gym owners are
    separate Supabase Auth users linked via userId on GymProfile.
  • Invoice shareToken: public URL to view/download PDF without login.
  • Multi-tenant: every query must be scoped by gymId from the JWT context.
  • POS / Sale: processes CASH, CARD, UPI payments — no payment gateway, manual.
  • Inventory: low-stock alerts via Notification; stock updated on each Sale.
  • Emergency contact data stored as plain text fields on Member.
  • Cron-triggered notifications (BIRTHDAY, EXPIRY_REMINDER, etc.).
  • RegistrationCode model for onboarding new gym tenants.

List ALL potential vulnerabilities including:
  • Authentication bypass risks (JWT tampering, session fixation)
  • Tenant isolation failures (gymId not enforced server-side)
  • Improper role enforcement (STAFF accessing owner-only routes)
  • Rate abuse (POS endpoint, invoice share link, registration codes)
  • Injection attacks (Prisma raw queries, if any)
  • Data exposure via shareToken (enumeration, no expiry)
  • Client-side trust issues (gymId passed from client, not derived from JWT)
  • PWA offline cache leaking sensitive member data

Then provide mitigation strategies for each, ranked by severity.
```

**Must-Ask Follow-Ups:**
*   "Is `gymId` ever derived from the client request body instead of the server-decoded JWT?"
*   "What is the blast radius if a `shareToken` is leaked or enumerated?"
*   "How does role enforcement work on Server Actions — is there a middleware gap?"
*   "Are RegistrationCodes single-use and time-limited? What prevents replay attacks?"

---

## 3. 🔗 Vendor Lock-In & Migration Audit

**Purpose**
Think past the MVP. Understand what parts of the Gym Mitra stack become difficult or expensive to replace at 100k users, and design escape hatches today.

**Filled Prompt — Copy & Paste Below:**

```text
You are a systems architect evaluating long-term scalability.

Gym Mitra ERP is built on:
  • Supabase (Auth, PostgreSQL, Storage, Realtime) — primary backend
  • Prisma ORM (prisma-client-js, directUrl for connection pooling)
  • Vercel (hosting, edge functions, analytics)
  • Resend (transactional email)
  • Next.js App Router (frontend + server-side logic)

At 100,000 users across thousands of gym tenants:
  • What migration challenges arise from Supabase Auth as the identity layer?
  • What parts of the system become hard to replace (Supabase RLS, Storage)?
  • What data portability issues exist (member data, invoice PDFs in Storage)?
  • What Supabase tier limitations might block scale
    (connection limits, row limits, storage caps)?
  • What Vercel cost or compute limits become painful?
  • Is Prisma a lock-in risk at this scale, or easily swapped?
  • What does a migration to self-hosted Postgres + custom auth look like?

Suggest how to design TODAY to reduce lock-in risk while keeping
development velocity high on the current stack.
```

**Key Areas to Pressure Test:**
*   **Supabase Auth JWT shape:** if we ever move off Supabase Auth, what breaks in our middleware?
*   **Storage URLs:** are invoice PDF URLs hardcoded to Supabase Storage CDN in the DB?
*   **Prisma migrations:** are they provider-agnostic or using Postgres-specific types?
*   **Vercel Edge vs Node runtime:** which features depend on full Node.js that break on Edge?

---

## 4. 💸 Cost Explosion Simulation

**Purpose**
Model cloud cost behavior across three growth stages before architectural choices are locked in. Identify which metrics drive spend and which decisions amplify cost sensitivity.

**Filled Prompt — Copy & Paste Below:**

```text
You are a cloud cost analyst.

Backend setup for Gym Mitra ERP:
  • Supabase: PostgreSQL (multi-tenant, ~15 tables), Auth, Storage (invoice PDFs,
    member photos), Realtime (optional), Supavisor connection pooling
  • Vercel: Next.js App Router, Server Actions, API routes, Edge Middleware
  • Resend: transactional email (birthday, expiry, payment overdue, low stock)
  • Cron jobs: scheduled Notification generation (daily or weekly sweep)

Estimate cost behavior at:
  • 100 DAU across 5–10 gym tenants
  • 1,000 DAU across 50–100 gym tenants
  • 10,000 DAU across 500–1,000 gym tenants

Identify:
  • Which metric drives cost: DB reads, DB writes, bandwidth, storage, function
    invocations, email sends, or connection pool overhead?
  • What can spike unexpectedly (e.g., invoice PDF generation, image uploads,
    notification fan-out across thousands of members)?
  • Which architectural decisions increase cost sensitivity
    (e.g., per-request DB connections, storing PDFs vs generating on-demand)?

Suggest optimizations for cost stability at each growth stage.
```

**High-Risk Cost Vectors to Probe:**
*   **Invoice PDF generation:** stored in Supabase Storage vs. generated on-demand per request — cost and egress implications?
*   **Notification cron fan-out:** 1,000 gyms × 500 members = 500,000 DB reads per sweep — acceptable?
*   **Member profile photos:** upload size limits, compression strategy, CDN caching headers.
*   **Supabase connection pooling:** how many Vercel serverless function instances can open simultaneously before pool exhaustion?

---

## 5. 💥 Failure Mode Simulation

**Purpose**
Understand what breaks first under sudden traffic spikes — before it happens in production. Map failure sequence, data inconsistency risks, and monitoring gaps.

**Filled Prompt — Copy & Paste Below:**

```text
You are a distributed systems engineer.

App architecture: Next.js App Router on Vercel (serverless). Supabase
PostgreSQL backend with Prisma ORM. Supavisor / PgBouncer for connection
pooling. Resend for email. Cron jobs for scheduled operations.
Multi-tenant: each request scoped to a gymId.

Simulate sudden traffic spikes (e.g., a gym chain with 50 locations
all open at 6 AM, flood of check-ins and POS transactions simultaneously).

Answer:
  • What fails first? (connection pool, DB CPU, Vercel cold starts?)
  • What slows down first?
  • What data becomes inconsistent?
    (stock levels on concurrent Sale inserts? invoiceCounter race conditions?
     attendance duplicate inserts despite unique constraint?)
  • What monitoring MUST exist to catch these before users notice?
  • How does the Notification cron behave if it overlaps with peak traffic?

Then recommend architectural safeguards:
  • Optimistic locking vs. pessimistic locking for inventory updates
  • Queue-based invoice generation vs. synchronous
  • Circuit breaker patterns for Supabase outages
  • Idempotency keys for POS transactions
```

**Failure Scenarios to Explicitly Cover:**
*   **Supabase Auth service degradation:** what happens to all in-flight requests? Graceful fallback or full outage?
*   **invoiceCounter race:** two concurrent invoice creations for the same gym — do they get duplicate invoice numbers?
*   **Resend outage:** does the notification system retry, queue, or silently fail? Is there dead-letter handling?
*   **Prisma connection pool saturation:** what is the default pool size and what happens when it is exhausted?

---

## 6. ✅ Completion vs. Stability Check (Bonus)

**Purpose**
Distinguish between ‘feature complete’ and ‘production stable.’ Force an honest audit of technical debt, separation of concerns, and shortcuts that will hurt at 100x scale.

**Filled Prompt — Copy & Paste Below:**

```text
Evaluate the system design of Gym Mitra ERP.

Stack: Next.js App Router + Supabase + Prisma + Vercel + Resend.

CURRENT DESIGN CHOICES:
  • All business logic lives in Next.js Server Actions and API routes
    (no separate service layer)
  • Tenant isolation enforced by application-layer gymId checks
    (not Supabase RLS)
  • Notifications generated synchronously in cron jobs
  • Invoice PDFs generated and stored in Supabase Storage
  • No message queue, no background job system beyond Vercel cron
  • PWA with offline support — service worker caches API responses
  • SaaS plan enforcement at the UI layer, not enforced at DB or API level

Does this system optimize for feature completion or long-term stability?

List:
  • Hidden technical debt (things that work now but will break later)
  • Unscalable shortcuts (patterns that are fine at 10 gyms, broken at 1000)
  • Poor separation of concerns (business logic mixed into framework layers)
  • Missing reliability primitives (retry logic, idempotency, circuit breakers)

Be critical. Assume this app will scale 100x within 18 months.
Rank findings by: Severity (Critical / High / Medium) and Effort to Fix.
```

**The Golden Follow-Up:**
If the AI says "Looks good." — respond with:
> *“What would break at scale? Give me the worst-case scenario.”*

---
*Gym Mitra ERP — Architecture Stress-Test Pack • Internal Pre-Build Document • February 2026*
