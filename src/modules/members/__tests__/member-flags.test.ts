/**
 * Tier 1 — Pure Function Tests: member-flags.ts
 * TDD: Tests verify BEHAVIOR through public interface.
 * computeMemberFlags is pure — no DB calls, no mocks needed.
 */
import { describe, it, expect } from 'vitest'
import { computeMemberFlags, type MemberWithSubsForFlags } from '../member-flags'
import { addDays, subDays } from 'date-fns'

// ── Helpers ────────────────────────────────────────────────────────────────────

const futureSub = (daysAhead: number) => ({
  status: 'ACTIVE' as const,
  startDate: new Date(),
  endDate: addDays(new Date(), daysAhead),
  plan: { name: 'Monthly', duration: 1 },
})

const pastSub = (daysAgo: number) => ({
  status: 'ACTIVE' as const, // DB status stale — flags should override
  startDate: subDays(new Date(), 60),
  endDate: subDays(new Date(), daysAgo),
  plan: { name: 'Monthly', duration: 1 },
})

const baseMember: MemberWithSubsForFlags = {
  status: 'ACTIVE',
  subscriptions: [],
  invoices: [],
}

// ── Subscription Status Flags ──────────────────────────────────────────────────

describe('computeMemberFlags — subscription status', () => {
  it('member with no subscription → no active plan, can edit plan', () => {
    const flags = computeMemberFlags(baseMember)
    expect(flags.hasActivePlan).toBe(false)
    expect(flags.canEditPlan).toBe(true)
    expect(flags.currentPlanName).toBeNull()
  })

  it('active subscription (30 days ahead) → ACTIVE, has plan, cannot edit', () => {
    const member = { ...baseMember, subscriptions: [futureSub(30)] }
    const flags = computeMemberFlags(member)
    expect(flags.effectiveStatus).toBe('ACTIVE')
    expect(flags.isExpired).toBe(false)
    expect(flags.isExpiringSoon).toBe(false)
    expect(flags.hasActivePlan).toBe(true)
    expect(flags.currentPlanName).toBe('Monthly')
    expect(flags.canEditPlan).toBe(false)
  })

  it('subscription expires in 3 days → EXPIRING_SOON', () => {
    const member = { ...baseMember, subscriptions: [futureSub(3)] }
    const flags = computeMemberFlags(member)
    expect(flags.effectiveStatus).toBe('EXPIRING_SOON')
    expect(flags.isExpiringSoon).toBe(true)
    expect(flags.isExpired).toBe(false)
  })

  it('subscription expired yesterday → EXPIRED (overrides stale DB status)', () => {
    // DB status=ACTIVE but subscription ended → flags compute EXPIRED
    const member = { ...baseMember, subscriptions: [pastSub(1)] }
    const flags = computeMemberFlags(member)
    expect(flags.isExpired).toBe(true)
    expect(flags.effectiveStatus).toBe('EXPIRED')
  })

  it('canRenew is always true regardless of status', () => {
    // Business rule: always allow renewal
    const expiredMember = { ...baseMember, subscriptions: [pastSub(30)] }
    expect(computeMemberFlags(expiredMember).canRenew).toBe(true)
    expect(computeMemberFlags(baseMember).canRenew).toBe(true)
    expect(computeMemberFlags({ ...baseMember, subscriptions: [futureSub(30)] }).canRenew).toBe(true)
  })
})

// ── Outstanding Balance Flags ──────────────────────────────────────────────────

describe('computeMemberFlags — outstanding balance', () => {
  it('no invoices → no outstanding balance', () => {
    const flags = computeMemberFlags(baseMember)
    expect(flags.hasOutstandingBalance).toBe(false)
    expect(flags.totalOutstanding).toBe(0)
  })

  it('fully paid invoice → no outstanding balance', () => {
    const member = {
      ...baseMember,
      invoices: [{ paymentStatus: 'PAID', balanceDue: 0, total: 1000 }],
    }
    const flags = computeMemberFlags(member)
    expect(flags.hasOutstandingBalance).toBe(false)
    expect(flags.totalOutstanding).toBe(0)
  })

  it('partial payment → outstanding balance = remaining amount', () => {
    const member = {
      ...baseMember,
      invoices: [{ paymentStatus: 'PARTIAL', balanceDue: 500, total: 1000 }],
    }
    const flags = computeMemberFlags(member)
    expect(flags.hasOutstandingBalance).toBe(true)
    expect(flags.totalOutstanding).toBe(500)
  })

  it('pending payment → outstanding balance = full amount', () => {
    const member = {
      ...baseMember,
      invoices: [{ paymentStatus: 'PENDING', balanceDue: 1200, total: 1200 }],
    }
    const flags = computeMemberFlags(member)
    expect(flags.hasOutstandingBalance).toBe(true)
    expect(flags.totalOutstanding).toBe(1200)
  })

  it('multiple unpaid invoices → total is summed correctly', () => {
    const member = {
      ...baseMember,
      invoices: [
        { paymentStatus: 'PARTIAL', balanceDue: 500, total: 1000 },
        { paymentStatus: 'PENDING', balanceDue: 300, total: 300 },
        { paymentStatus: 'PAID', balanceDue: 0, total: 200 }, // Should NOT count
      ],
    }
    const flags = computeMemberFlags(member)
    expect(flags.hasOutstandingBalance).toBe(true)
    expect(flags.totalOutstanding).toBe(800) // 500 + 300, NOT 200
  })

  it('Decimal object from Prisma: balanceDue as object → converted correctly', () => {
    // Prisma returns Decimal objects, not plain numbers
    // toNumber() in the serializer handles this
    const member = {
      ...baseMember,
      invoices: [
        {
          paymentStatus: 'PARTIAL',
          balanceDue: { toNumber: () => 750 } as any,
          total: { toNumber: () => 1500 } as any,
        },
      ],
    }
    const flags = computeMemberFlags(member)
    expect(flags.totalOutstanding).toBe(750)
  })
})
