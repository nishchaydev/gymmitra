# GymMitra — System Test Checklist

> **MANDATORY** after every major code change. Do NOT skip any section.
> A "major change" = service layer, validator, repository, schema migration, or form refactoring.

---

## 1. Member CRUD (Create / Read / Update)

- [ ] **Create member WITHOUT plan** → member saved, no subscription, no invoice
- [ ] **Create member WITH plan** → member + subscription + invoice all created
- [ ] **Create member with PARTIAL payment** → invoice shows correct `balanceDue`
- [ ] **Edit member** (name, phone, email, DOB) → changes saved, audit log created
- [ ] **Duplicate phone check** → error message shown, member NOT created
- [ ] **Member detail page loads** → status badge, subscription info, attendance log, invoices all visible

## 2. Subscription & Renewal

- [ ] **Renew BEFORE expiry** (stacking) → new sub starts from old end date
- [ ] **Renew AFTER expiry** (fresh start) → new sub starts from today
- [ ] **Subscription status** → shows ACTIVE/EXPIRED/EXPIRING_SOON correctly based on dates
- [ ] **Business flags** → `canRenew`, `canEditPlan`, `hasOutstandingBalance` render correctly

## 3. Invoicing & Billing

- [ ] **Create invoice (membership type)** → correct tax, discount, total calculation
- [ ] **Create invoice (product/walk-in type)** → walk-in fields populated
- [ ] **Partial payment** → balanceDue calculated, status = PARTIAL
- [ ] **Full payment** → balanceDue = 0, status = PAID
- [ ] **Record additional payment** → balanceDue decrements correctly
- [ ] **Idempotency** → duplicate invoice request with same key returns existing invoice
- [ ] **No string numbers** → all monetary values are `Number`, not `"123"`

## 4. Data Normalization

- [ ] **Decimal → Number** → Invoice totals, subscription prices, product prices all render as numbers (not `Decimal { value: "2500" }`)
- [ ] **No NaN in UI** → all `toNumber()` calls handle null/undefined gracefully
- [ ] **Form defaults** → no `undefined` values cause controlled/uncontrolled React warnings

## 5. Import (CSV)

- [ ] **Valid CSV** → members created with correct subscriptions
- [ ] **Duplicate phones in CSV** → duplicates skipped, count shown
- [ ] **Missing plan name** → plan auto-created, member assigned
- [ ] **Invalid data** → invalid rows skipped with clear error messages

## 6. Authentication & Multi-Tenancy

- [ ] **gymId scoping** → member from Gym A is NOT visible in Gym B
- [ ] **Role-based access** → STAFF can create members, non-OWNER/STAFF blocked
- [ ] **Demo mode** → all pages work with mock data when demo cookie is set

---

## How to Run

1. Complete all checks manually in the running app
2. Mark each item `[x]` as you verify
3. If ANY item fails: **STOP**, fix the issue, and re-run from the failed section
4. Only proceed to deployment when ALL items are `[x]`

## Severity Classification

| Failure | Action |
|---|---|
| **Member CRUD fails** | 🔴 CRITICAL — block all work |
| **Invoice math wrong** | 🔴 CRITICAL — block all work |
| **Decimal leak to UI** | 🟡 HIGH — fix before deploy |
| **CSV import edge case** | 🟢 MEDIUM — fix in next sprint |
