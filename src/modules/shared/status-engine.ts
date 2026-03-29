/**
 * Member Status Engine — Single Source of Truth
 * 
 * Centralized member status calculation and sync logic.
 * 
 * RULES:
 *   1. getMemberStatus() is a PURE function — no side effects, no DB calls
 *   2. syncMemberStatuses() is the ONLY place that writes status to DB
 *   3. churnedAt is ONLY set during actual status transitions
 *   4. All DB access goes through MemberRepository (no direct Prisma)
 */

import { differenceInDays, addDays, isBefore } from 'date-fns'

export type MemberStatusType = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'INACTIVE'

/** Statuses that count as "churned" for analytics */
export const CHURNED_STATUSES: MemberStatusType[] = ['INACTIVE', 'EXPIRED']

export interface MemberStatusInput {
  expiryDate: Date | null
  lastCheckIn: Date | null
}

/**
 * Calculate member status dynamically based on subscription expiry and attendance.
 * This is a PURE function — no DB calls, no side effects.
 * 
 * Logic:
 *   - No expiry date → INACTIVE
 *   - Past expiry → EXPIRED
 *   - Expiring within 7 days → EXPIRING_SOON
 *   - No check-in for 30+ days → INACTIVE
 *   - Otherwise → ACTIVE
 */
export function getMemberStatus(member: MemberStatusInput): MemberStatusType {
  const today = new Date()
  const sevenDaysFromNow = addDays(today, 7)

  if (!member.expiryDate) return 'INACTIVE'
  if (isBefore(member.expiryDate, today)) return 'EXPIRED'
  if (isBefore(member.expiryDate, sevenDaysFromNow) || isDateEqual(member.expiryDate, sevenDaysFromNow)) return 'EXPIRING_SOON'
  // Note: 30-day inactivity is tracked in analytics/insights only.
  // A paid member with a valid subscription must never be blocked at kiosk.
  return 'ACTIVE'
}

/**
 * Batch-sync member statuses for a gym.
 * Groups updates by status type to avoid N+1 queries.
 * Sets `churnedAt` only on actual transitions to churned status.
 * 
 * All DB access goes through MemberRepository — NO direct Prisma usage.
 * 
 * @param gymId - The gym to sync statuses for
 */
export async function syncMemberStatuses(gymId: string) {
  const { MemberRepository } = await import('@/src/modules/members/repository')

  const membersWithData = await MemberRepository.findMembersForStatusSync(gymId)

  // Group status changes into batch updates (max 4 queries instead of N)
  const groupedByStatus = new Map<string, string[]>()
  for (const member of membersWithData) {
    const expiryDate = member.subscriptions[0]?.endDate ?? null
    const lastCheckIn = member.attendance[0]?.date ?? null
    const calculatedStatus = getMemberStatus({
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      lastCheckIn: lastCheckIn ? new Date(lastCheckIn) : null
    })
    if (member.status !== calculatedStatus) {
      const ids = groupedByStatus.get(calculatedStatus) || []
      ids.push(member.id)
      groupedByStatus.set(calculatedStatus, ids)
    }
  }

  // Execute batch updates via repository — one per status type
  const updates = Array.from(groupedByStatus.entries()).map(([status, ids]) => ({
    ids,
    status,
    churnedAt: CHURNED_STATUSES.includes(status as MemberStatusType) ? new Date() : null
  }))

  if (updates.length > 0) {
    await MemberRepository.batchUpdateStatuses(updates)
  }
}

// Internal helper
function isDateEqual(date1: Date, date2: Date): boolean {
  return date1.getTime() === date2.getTime()
}
