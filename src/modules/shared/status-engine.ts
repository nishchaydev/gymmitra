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

import { addDays } from 'date-fns'

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
 *   - Past expiry (IST date comparison) → EXPIRED
 *   - Expiring within 7 days → EXPIRING_SOON
 *   - Otherwise → ACTIVE
 * 
 * Uses IST date-string comparison to prevent midnight-boundary bugs
 * (e.g., member marked EXPIRED at 9 AM on their last day).
 */
export function getMemberStatus(member: MemberStatusInput): MemberStatusType {
  if (!member.expiryDate) return 'INACTIVE'

  const todayStr = toISTDateString(new Date())
  const expiryStr = toISTDateString(member.expiryDate)
  const sevenDaysStr = toISTDateString(addDays(new Date(), 7))

  if (expiryStr < todayStr) return 'EXPIRED'
  if (expiryStr <= sevenDaysStr) return 'EXPIRING_SOON'
  return 'ACTIVE'
}

/**
 * Convert a Date to YYYY-MM-DD string in IST timezone.
 * Used for date-only comparisons that avoid midnight-boundary bugs.
 */
function toISTDateString(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
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
    await MemberRepository.batchUpdateStatuses(gymId, updates as any)
  }
}
