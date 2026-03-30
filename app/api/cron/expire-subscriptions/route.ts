import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { addDays } from 'date-fns'
import { guardRateLimit } from '@/lib/rate-limit'
import { syncMemberStatuses } from '@/src/modules/shared/status-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 10 // Vercel Hobby plan limit

export async function GET(request: NextRequest) {
    // Basic rate limit for cron to prevent DDOS attempts against the URL
    // Use IP or a static key since this is server-to-server
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const rawIp = realIp || forwardedFor || '127.0.0.1'
    const ip = rawIp.split(',')[0].trim() || '127.0.0.1'

    const FAIL_OPEN = false;
    const rl = await guardRateLimit(5, `cron:expire:${ip}`, FAIL_OPEN)
    if (rl) return rl

    // 1. Verify CRON_SECRET
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
        console.error('[Cron:ExpireSubs] CRON_SECRET not configured')
        return new Response('Server misconfigured', { status: 500 })
    }

    const authHeader = request.headers.get('authorization') || ''
    const expected = `Bearer ${cronSecret}`

    // Constant-time comparison
    const hmacHeader = crypto.createHmac('sha256', cronSecret).update(authHeader).digest()
    const hmacExpected = crypto.createHmac('sha256', cronSecret).update(expected).digest()
    if (!crypto.timingSafeEqual(hmacHeader, hmacExpected)) {
        return new Response('Unauthorized', { status: 401 })
    }

    try {
        const now = new Date()

        // 2. Expire all ACTIVE subscriptions where endDate has passed
        const expiredSubs = await prisma.memberSubscription.updateMany({
            where: {
                status: 'ACTIVE',
                endDate: { lt: now },
            },
            data: {
                status: 'EXPIRED',
            },
        })

        console.log(`[Cron:ExpireSubs] Expired ${expiredSubs.count} subscriptions`)

        // 2b. Mark overdue invoices — PENDING invoices past their due date become OVERDUE
        const overdueResult = await prisma.invoice.updateMany({
            where: {
                paymentStatus: 'PENDING',
                dueDate: { lt: now },
            },
            data: { paymentStatus: 'OVERDUE' }
        })
        console.log(`[Cron:ExpireSubs] Marked ${overdueResult.count} invoices as OVERDUE`)

        // 3. Find members who have NO remaining active subscriptions and update their status
        // Get all distinct memberIds that just got expired
        const expiredMemberSubs = await prisma.memberSubscription.findMany({
            where: {
                status: 'EXPIRED',
                endDate: { lt: now },
                member: { status: 'ACTIVE' },
            },
            select: { memberId: true, gymId: true },
            distinct: ['memberId'],
        })

        let membersExpired = 0

        const expiredMemberIds = expiredMemberSubs.map(s => s.memberId)

        if (expiredMemberIds.length > 0) {
            // Find members from this list who STILL have an active subscription
            // and update those without one atomically
            membersExpired = await prisma.$transaction(async (tx) => {
                const membersWithActiveSubs = await tx.memberSubscription.findMany({
                    where: {
                        memberId: { in: expiredMemberIds },
                        status: 'ACTIVE',
                    },
                    select: { memberId: true },
                    distinct: ['memberId'],
                })
                const activeSubMemberIds = new Set(membersWithActiveSubs.map(s => s.memberId))

                // Members to expire are those who don't have an active sub
                const membersToUpdate = expiredMemberIds.filter(id => !activeSubMemberIds.has(id))

                if (membersToUpdate.length > 0) {
                    const updateResult = await tx.member.updateMany({
                        where: { id: { in: membersToUpdate } },
                        data: { status: 'EXPIRED' },
                    })
                    return updateResult.count
                }
                return 0
            })
        }

        console.log(`[Cron:ExpireSubs] Updated ${membersExpired} member statuses to EXPIRED`)

        // 4. Sync EXPIRING_SOON for all affected gyms + gyms with members expiring within 7 days
        // This ensures members transitioning from ACTIVE → EXPIRING_SOON get their status updated
        const affectedGymIds = [...new Set(expiredMemberSubs.map(s => s.gymId))]

        // Also find gyms with members expiring within 7 days (EXPIRING_SOON transition)
        const gymsNeedingSync = await prisma.memberSubscription.findMany({
            where: { status: 'ACTIVE', endDate: { lte: addDays(now, 7) } },
            select: { gymId: true },
            distinct: ['gymId']
        })

        const allGymIds = [...new Set([
            ...affectedGymIds,
            ...gymsNeedingSync.map(s => s.gymId)
        ])]

        for (const gymId of allGymIds) {
            try {
                await syncMemberStatuses(gymId)
            } catch (syncErr) {
                console.error(`[Cron:ExpireSubs] Failed to sync statuses for gym ${gymId}:`, syncErr)
            }
        }

        return NextResponse.json({
            success: true,
            subscriptionsExpired: expiredSubs.count,
            membersExpired,
            gymsStatusSynced: affectedGymIds.length,
            timestamp: now.toISOString(),
        })
    } catch (error) {
        console.error('[Cron:ExpireSubs] Fatal error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
