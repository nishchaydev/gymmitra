/**
 * Member Business Logic Flags — Single Source of Truth
 * 
 * Computes all business-state flags from member data.
 * UI should NEVER decide business logic — only render based on these flags.
 * 
 * RULES:
 *   1. This is a PURE function — no DB calls, no side effects
 *   2. All business decisions about a member flow through here
 *   3. UI reads flags, never computes them
 */

import { getMemberStatus, type MemberStatusType } from '@/src/modules/shared/status-engine'
import { toNumber } from '@/src/modules/shared/serializers'

export interface MemberWithSubsForFlags {
  status: string
  subscriptions: Array<{
    status: string
    startDate: Date | string
    endDate: Date | string
    plan: { name: string; duration?: number }
  }>
  invoices: Array<{
    paymentStatus: string
    balanceDue: unknown // Could be Decimal
    total: unknown // Could be Decimal
  }>
  membershipDuration?: number | null
  subscriptionEndDate?: Date | string | null
}

export interface MemberFlags {
  /** Whether the member's latest subscription has expired */
  isExpired: boolean
  /** Whether the member's subscription expires within 7 days */
  isExpiringSoon: boolean
  /** Whether the member can renew/purchase a new subscription */
  canRenew: boolean
  /** Whether the member's plan can be edited (no active sub) */
  canEditPlan: boolean
  /** Computed effective status (overrides DB status if stale) */
  effectiveStatus: MemberStatusType
  /** Whether the member has unpaid invoices */
  hasOutstandingBalance: boolean
  /** Total amount outstanding across all unpaid invoices */
  totalOutstanding: number
  /** Whether the member has any active subscription */
  hasActivePlan: boolean
  /** Name of the current plan (if any) */
  currentPlanName: string | null
}

/**
 * Compute all business logic flags for a member.
 * 
 * @example
 * ```ts
 * const flags = computeMemberFlags(member)
 * // UI renders:
 * // flags.effectiveStatus → badge color
 * // flags.canRenew → show renew button
 * // flags.totalOutstanding → show payment reminder
 * ```
 */
export function computeMemberFlags(member: MemberWithSubsForFlags): MemberFlags {
  const now = new Date()

  // Determine active subscription
  const activeSub = member.subscriptions.find(s => s.status === 'ACTIVE')
  const latestSub = member.subscriptions[0] // Assumed sorted by endDate desc

  // Compute subscription end date (from subscription or legacy fields)
  const subEndDate = latestSub?.endDate || member.subscriptionEndDate
  const expiryDate = subEndDate ? new Date(subEndDate) : null

  // Use status engine for authoritative status
  const computedStatus = getMemberStatus({
    expiryDate,
    lastCheckIn: null, // We don't have this in the current query; status-engine handles null gracefully
  })

  // Override stale DB status
  const effectiveStatus: MemberStatusType =
    member.status === 'ACTIVE' && expiryDate && expiryDate < now
      ? 'EXPIRED'
      : computedStatus

  // Outstanding balance calculation
  const outstandingInvoices = member.invoices.filter(
    inv => inv.paymentStatus === 'PARTIAL' || inv.paymentStatus === 'PENDING'
  )
  const totalOutstanding = outstandingInvoices.reduce(
    (sum, inv) => sum + toNumber(inv.balanceDue),
    0
  )

  // Business flags
  const isExpired = effectiveStatus === 'EXPIRED'
  const isExpiringSoon = effectiveStatus === 'EXPIRING_SOON'
  const legacyActive = !!member.membershipDuration && !!member.subscriptionEndDate && new Date(member.subscriptionEndDate) > now
  const hasActivePlan = !!activeSub || legacyActive

  return {
    isExpired,
    isExpiringSoon,
    canRenew: true, // Members can always renew regardless of status
    canEditPlan: !activeSub, // Can only change plan if no active subscription
    effectiveStatus,
    hasOutstandingBalance: totalOutstanding > 0,
    totalOutstanding,
    hasActivePlan,
    currentPlanName: activeSub?.plan?.name || (legacyActive ? `${member.membershipDuration} Month Plan` : null),
  }
}
