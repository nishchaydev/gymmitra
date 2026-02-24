---
description: Red Team Audit for GymMitra Engineering Team
---

# GymMitra Red Team Audit & Dashboard

This document provides a structured, adversarial testing framework that developers must run against the staging environment before major releases or onboarding large gym clients. It is designed to simulate the most damaging scenarios for our multi‑tenant SaaS (Next.js, Prisma, Supabase, Vercel) and expose cracks before production scale.

## 🛡️ Red Team Audit Checklist

### 1. Multi‑Tenant Isolation
- **Cross‑Tenant Query Test:** Attempt to fetch data from another gym by manipulating `gymId` in API requests. Verify strict filtering at the Prisma layer and DB constraints.
- **JWT Tampering:** Modify JWT payloads to impersonate another gym’s staff. Ensure RBAC checks at API boundary reject forged claims.
- **Foreign Key Enforcement:** Try inserting records without a valid `gymId`. Confirm DB rejects orphaned rows.

### 2. Concurrency & Race Conditions
- **Double Booking Attack:** Simulate two trainers booking the same slot simultaneously. Confirm unique compound constraints prevent duplicate entries.
- **Payment Race:** Trigger multiple payment attempts for the same invoice. Ensure idempotency logic prevents double credit.
- **Bulk Membership Renewal:** Run 1,000 concurrent renewals. Confirm transaction isolation holds and no duplicate subscriptions are created.

### 3. Catastrophic Failure Recovery
- **Database Outage Drill:** Kill Supabase connection mid‑transaction. Verify app fails gracefully and retries appropriately.
- **Webhook Failure Simulation:** Block Razorpay webhook delivery. Confirm cron‑based reconciliation script resolves pending invoices.
- **Rollback Test:** Deploy a breaking migration on staging, then roll back. Ensure Vercel atomic rollback restores functionality without data corruption.

### 4. Security & Insider Threats
- **Privilege Escalation Attempt:** Try accessing `/api/invoices` with a TRAINER role. Confirm RBAC denies access.
- **Audit Log Integrity:** Simulate a manager editing invoices. Verify AuditLog captures actorId, resourceId, and state changes.
- **Brute Force Attack:** Run 1,000 login attempts from a single IP. Confirm Upstash Redis rate limiting blocks and logs attempts.

### 5. Data Integrity & Analytics
- **Churn Misclassification:** Create a member who skips 20 days but renews subscription. Verify churn logic doesn’t falsely flag them.
- **Heavy Analytics Query:** Run peak‑hour attendance queries under load. Confirm OLTP performance doesn’t degrade.
- **N+1 Query Detection:** Inspect Prisma queries for nested includes. Ensure aggregates (_count, _sum) are used instead of array reductions.

### 6. UX & Offline Resilience
- **Offline Attendance Test:** Disconnect network during check‑in. Verify queued writes sync correctly when reconnected (or fail gracefully if not yet implemented).
- **Error Recovery Drill:** Force a payment failure. Confirm UI preserves form state and shows actionable error messages.
- **PWA Installability:** Test GymMitra as a PWA on mobile. Verify service worker caching and offline shell availability.

### 7. Operational Resilience
- **Disaster Recovery Drill:** Simulate Supabase outage. Verify backup restore plan and RTO/RPO targets.
- **Monitoring & Alerts:** Confirm centralized logging (e.g., Sentry) captures client‑side and server‑side errors.
- **Load Spike Simulation:** Run k6 spike tests with 10,000 concurrent requests. Verify system doesn’t exhaust PgBouncer connections.

---

## 🎯 Red Team Audit Scoring Rubric

### 🔴 Critical Severity
- **Definition:** Failures that compromise tenant isolation, financial integrity, or system availability.
- **Examples:**
  - Data bleed between gyms (cross‑tenant access).
  - Double‑crediting or loss of payment due to idempotency failure.
  - Catastrophic outage with no recovery path (e.g., Supabase down, no backups).
- **Action:** Immediate hotfix. Stop all feature work until resolved. Escalate to founders/lead engineers.

### 🟠 High Severity
- **Definition:** Failures that don’t immediately compromise integrity but cause major disruption or reputational damage.
- **Examples:**
  - Race condition leading to duplicate bookings.
  - RBAC bypass allowing unauthorized staff to view financial data.
  - Analytics queries degrading production DB performance.
- **Action:** Prioritize in current sprint. Fix before onboarding new gyms.

### 🟡 Medium Severity
- **Definition:** Failures that affect usability, performance, or resilience but don’t risk data integrity.
- **Examples:**
  - Offline attendance not syncing correctly.
  - Error recovery UX failing to preserve form state.
  - Load spike tests showing degraded latency but no crashes.
- **Action:** Schedule for next sprint. Monitor impact in staging.

### 🟢 Low Severity
- **Definition:** Minor issues, edge cases, or cosmetic flaws that don’t affect core functionality.
- **Examples:**
  - PWA installability quirks on certain browsers.
  - Non‑critical client‑side errors not logged centrally.
  - Churn heuristic misclassifying a small subset of members.
- **Action:** Backlog item. Fix opportunistically.

---

## 📊 Red Team Audit Dashboard Template

**How to Use this Dashboard:**
- Each scenario from the Checklist gets a unique ID (MT = Multi‑Tenant, CC = Concurrency, CF = Catastrophic Failure, SEC = Security, DA = Data Analytics, UX = UX/Offline, OP = Operational).
- Developers record Outcome + Severity using the rubric.
- Remediation plans are logged inline, with Owner + ETA for accountability.
- The Summary section gives leadership instant visibility into whether the product is safe to scale.

### Audit Metadata
- **Date:** [YYYY-MM-DD]
- **Auditor:** [Name]
- **Environment:** [Staging/Production]
- **Version/Commit Hash:** [Git SHA]

### Scenario Outcomes

| Scenario ID | Category                | Description                                      | Outcome (Pass/Fail) | Severity (Critical/High/Medium/Low) | Remediation Plan | Owner | ETA |
|-------------|--------------------------|--------------------------------------------------|---------------------|-------------------------------------|------------------|-------|-----|
| MT-01       | Multi-Tenant Isolation   | Attempt cross-tenant query via gymId tampering   |                     |                                     |                  |       |     |
| CC-02       | Concurrency              | Double booking race condition                    |                     |                                     |                  |       |     |
| CF-03       | Catastrophic Failure     | Supabase outage drill                            |                     |                                     |                  |       |     |
| SEC-04      | Security                 | RBAC bypass attempt                              |                     |                                     |                  |       |     |
| DA-05       | Data Integrity           | Churn misclassification test                     |                     |                                     |                  |       |     |
| UX-06       | UX & Offline             | Offline attendance sync                          |                     |                                     |                  |       |     |
| OP-07       | Operational Resilience   | Load spike simulation (10k requests)             |                     |                                     |                  |       |     |

### Summary
- **Critical Issues:** [Count]
- **High Issues:** [Count]
- **Medium Issues:** [Count]
- **Low Issues:** [Count]

**Next Steps:**
- Critical → Immediate hotfix, block feature work.
- High → Fix in current sprint.
- Medium → Schedule for next sprint.
- Low → Backlog item.
