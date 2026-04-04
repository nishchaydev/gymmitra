# Logical Errors Audit - GymMitra ERP
**Generated:** 2026-04-04  
**Scope:** Business logic bugs that could affect system functionality

---

## 🎯 Executive Summary

**Status:** Preliminary analysis + Deep AI scan in progress

**Critical Issues Found:** 0 (so far)  
**High Priority:** 2  
**Medium Priority:** 3  
**Low Priority:** 1  

**Overall Assessment:** ✅ Code quality is GOOD. Multi-tenancy and security patterns are properly implemented. Found some edge cases and improvement opportunities.

---

## ⚠️ HIGH PRIORITY ISSUES

### 1. Timezone Inconsistency in Member Status Calculation
**File:** `src/modules/shared/status-engine.ts:41-43`  
**Issue:** Status engine hardcodes 'Asia/Kolkata' timezone instead of using `gym.timezone`

```typescript
// CURRENT CODE (line 54-56):
function toISTDateString(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}
```

**Problem:**
- If a gym is in a different timezone, member statuses will be calculated based on IST, not their local time
- A member could appear EXPIRED at 9 AM their time because it's already midnight in IST

**Impact:** Medium-High
- Wrong member status display
- Incorrect expiry notifications
- Members marked expired too early/late

**Fix:**
```typescript
// Pass gym timezone to status calculation
export function getMemberStatus(
  member: MemberStatusInput, 
  timezone: string = 'Asia/Kolkata'
): MemberStatusType {
  const todayStr = toDateString(new Date(), timezone)
  const expiryStr = toDateString(member.expiryDate, timezone)
  // ...
}

function toDateString(d: Date, timezone: string): string {
  return d.toLocaleDateString('en-CA', { timeZone: timezone })
}
```

**Recommendation:** Make timezone a required parameter in getMemberStatus()

---

### 2. Race Condition in Invoice Number Generation
**File:** `src/modules/billing/repository.ts` (need to verify implementation)  
**Issue:** Invoice number generation may not be atomic

**Problem:**
- If two invoices are created simultaneously, they might get the same invoice number
- Pattern: "Get max number → increment → save" is vulnerable to race conditions

**Scenario:**
```
Time T1: User A gets max invoice# = 1000
Time T2: User B gets max invoice# = 1000 (before A saves)
Time T3: User A saves invoice #1001
Time T4: User B saves invoice #1001 ❌ DUPLICATE!
```

**Impact:** High
- Duplicate invoice numbers
- Accounting confusion
- Legal/audit issues

**Verification Needed:**
- Check if `generateInvoiceNumber()` uses database transaction
- Verify if there's a unique constraint on invoiceNumber

**Fix (if not already implemented):**
```typescript
// Use database atomic increment or SELECT FOR UPDATE
await tx.$executeRaw`
  UPDATE "InvoiceCounter" 
  SET counter = counter + 1 
  WHERE gymId = ${gymId}
  RETURNING counter
`
```

---

## 🔶 MEDIUM PRIORITY ISSUES

### 3. Member Status Sync Missing Timezone Context
**File:** `src/modules/shared/status-engine.ts:67`  
**Issue:** `syncMemberStatuses()` doesn't pass gym timezone to `getMemberStatus()`

```typescript
// Line 75-80
const calculatedStatus = getMemberStatus({
  expiryDate: expiryDate ? new Date(expiryDate) : null,
  lastCheckIn: lastCheckIn ? new Date(lastCheckIn) : null
})
// Missing: timezone parameter!
```

**Impact:** Medium
- All gyms use IST for status calculations
- Wrong status transitions for non-IST gyms

**Fix:** Fetch gym timezone and pass to getMemberStatus()

---

### 4. Potential Decimal Precision Issues in Billing
**File:** `app/api/invoices/route.ts:164`  
**Issue:** Rounding only on final total, not on intermediate calculations

```typescript
// Line 158-164
const subtotal = validatedData.items.reduce((acc, item) => {
    return acc + (item.quantity * item.unitPrice)
}, 0)

const afterDiscount = Math.max(0, subtotal - validatedData.discount)
const total = Math.round((afterDiscount + validatedData.taxAmount) * 100) / 100
```

**Problem:**
- JavaScript floating point: `0.1 + 0.2 = 0.30000000000000004`
- If `item.unitPrice` has many decimals, accumulated error possible
- Rounding only at end can cause 1 paisa discrepancies

**Example:**
```
Item 1: 333.33
Item 2: 333.33  
Item 3: 333.33
Subtotal: 999.99 (but could be 999.9899999...)
```

**Impact:** Low-Medium
- Small currency discrepancies (1-2 paisa)
- Rare but annoying for accounting

**Fix:**
```typescript
const subtotal = validatedData.items.reduce((acc, item) => {
    const itemTotal = Math.round(item.quantity * item.unitPrice * 100) / 100
    return Math.round((acc + itemTotal) * 100) / 100
}, 0)
```

**OR** Use a decimal library like `decimal.js` for all money calculations.

---

### 5. Soft Delete Queries May Miss `deletedAt` Filter
**Files:** Multiple API routes  
**Issue:** Some queries filter `deletedAt IS NULL`, some don't

**Verified Good:**
- `app/api/members/route.ts:34` ✅ Filters deletedAt
- `app/api/members/route.ts:126-127` ✅ Filters deletedAt in raw SQL

**Need to verify:** Other endpoints consistently filter soft-deleted records

**Impact:** Medium
- Users might see deleted members/subscriptions
- Reports include deleted data

**Fix:** Add `deletedAt: null` to ALL queries, or use Prisma middleware to auto-filter

---

## ⚪ LOW PRIORITY / MINOR ISSUES

### 6. Missing Validation: Future Start Dates for Expired Subscriptions
**File:** `src/modules/members/service.ts:107-109`  
**Issue:** Can create subscription starting after current subscription expires

```typescript
const startDate = currentSub?.endDate && currentSub.endDate > new Date()
    ? currentSub.endDate  // Stack from current end
    : new Date()          // Or start today
```

**Edge Case:**
- Member has subscription ending in 2 months
- Create new subscription → starts 2 months in future
- Member has no active subscription for 2 months (gap)

**Is this intended behavior?**
- If YES: Needs UI warning "New subscription starts in 2 months"
- If NO: Should allow overlap or immediate start

**Impact:** Low
- Confusing UX
- Member thinks they're active but subscription hasn't started

**Fix:** Add validation or UI warning about future start dates

---

## ✅ GOOD PATTERNS OBSERVED

### Security & Multi-Tenancy
✅ **Proper gymId filtering** in all checked routes  
✅ **IDOR protection** - validates member belongs to gym before queries  
✅ **Authentication** via `getAuthGym()` consistently  
✅ **Role-based access control** implemented  
✅ **Rate limiting** on critical endpoints  

### Transaction Safety
✅ **Member cap enforcement** uses SERIALIZABLE transaction (service.ts:56)  
✅ **Atomic subscription + invoice creation**  
✅ **No direct Prisma in API routes** - uses service/repository pattern  

### Data Integrity
✅ **Phone normalization** prevents duplicates  
✅ **Idempotency keys** for invoice creation  
✅ **Audit logging** on critical operations  

### Timezone Handling
✅ **Status engine uses timezone-aware comparisons**  
⚠️ Just needs dynamic timezone instead of hardcoded IST

---

## 🔍 AREAS NEEDING VERIFICATION

**The deep scan agents are checking:**

1. **All API routes** for missing gymId filters
2. **Subscription renewal logic** for calculation errors
3. **Payment recording** for double-payment scenarios
4. **Member cap** enforcement in bulk operations
5. **Timezone bugs** in date calculations
6. **Race conditions** in concurrent operations
7. **Soft delete** consistency across all queries

**Agents still running... results will include:**
- Specific file and line numbers
- Real-world scenarios that break
- Detailed fix recommendations

---

## 📊 RISK ASSESSMENT

| Category | Risk Level | Notes |
|----------|-----------|-------|
| **Security/Auth** | 🟢 LOW | Proper patterns observed |
| **Multi-tenancy** | 🟢 LOW | gymId consistently filtered |
| **Billing Logic** | 🟡 MEDIUM | Minor precision issues possible |
| **Timezone Handling** | 🟡 MEDIUM | Hardcoded IST needs fixing |
| **Race Conditions** | 🟡 MEDIUM | Invoice# generation to verify |
| **Data Integrity** | 🟢 LOW | Good validation and constraints |

---

## 🎯 RECOMMENDED ACTIONS

### Immediate (This Week)
1. ✅ Fix timezone hardcoding in status-engine.ts
2. ✅ Verify invoice number generation is atomic
3. ✅ Add timezone parameter to syncMemberStatuses()

### Short Term (This Month)
4. Audit all soft-delete queries for consistency
5. Consider decimal.js for money calculations
6. Add UI warnings for future subscription starts

### Long Term (Nice to Have)
7. Prisma middleware for auto-filtering deletedAt
8. Centralized timezone handling utility
9. Add integration tests for race conditions

---

## 📝 NOTES

**Code Quality:** Overall code is well-structured with good separation of concerns (service/repository pattern). Security and multi-tenancy are handled properly.

**Main Risk:** Timezone inconsistencies could cause real user-facing bugs. Everything is calculated in IST regardless of gym location.

**Positive:** Transaction isolation (SERIALIZABLE) prevents the most critical race conditions (member cap enforcement).

---

**Waiting for deep scan results to complete this report...**

*Deep scan agents: security-logic-scan, billing-logic-scan, business-logic-scan*
