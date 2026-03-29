/**
 * Member Status Engine — Single Source of Truth
 * 
 * Centralized member status calculation and sync logic.
 * Replaces scattered logic in:
 *   - lib/utils.ts (getMemberStatus, syncMemberStatuses)
 *   - api/cron/daily-reminders (inline status checks)
 *   - api/reminders (inline status checks)
 * 
 * RULES:
 *   1. getMemberStatus() is a PURE function — no side effects, no DB calls
 *   2. syncMemberStatuses() is the ONLY place that writes status to DB
 *   3. churnedAt is ONLY set during actual status transitions
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
  if (member.lastCheckIn && differenceInDays(today, member.lastCheckIn) > 30) return 'INACTIVE'
  return 'ACTIVE'
}

/**
 * Batch-sync member statuses for a gym.
 * Groups updates by status type to avoid N+1 queries.
 * Sets `churnedAt` only on actual transitions to churned status.
 * 
 * @param gymId - The gym to sync statuses for
 */
export async function syncMemberStatuses(gymId: string) {
  const { prisma } = await import('@/lib/prisma')
   
  const membersWithData = await prisma.member.findMany({
    where: { gymId },
    select: {
      id: true,
      status: true,
      subscriptions: {
        where: { status: 'ACTIVE' },
        orderBy: { endDate: 'desc' },
        take: 1,
        select: { endDate: true }
      },
      attendance: {
        orderBy: { date: 'desc' },
        take: 1,
        select: { date: true }
      }
    }
  })

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

  // Execute batch updates — one per status type
  for (const [status, ids] of groupedByStatus) {
    await prisma.member.updateMany({
      where: { id: { in: ids } },
      data: {
        status: status as any,
        // Set churnedAt when transitioning to churned status, clear it otherwise
        ...(CHURNED_STATUSES.includes(status as MemberStatusType)
          ? { churnedAt: new Date() }
          : { churnedAt: null })
      }
    })
  }
}

// Internal helper
function isDateEqual(date1: Date, date2: Date): boolean {
  return date1.getTime() === date2.getTime()
}
