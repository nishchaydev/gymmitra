import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { guardRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
    // Basic rate limit for cron to prevent DDOS attempts against the URL
    // Use IP or a static key since this is server-to-server
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const rawIp = realIp || forwardedFor || '127.0.0.1'
    const ip = rawIp.split(',')[0].trim() || '127.0.0.1'

    const rl = await guardRateLimit(5, `cron:expire:${ip}`, false)
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

        // 3. Find members who have NO remaining active subscriptions and update their status
        // Get all distinct memberIds that just got expired
        const expiredMemberSubs = await prisma.memberSubscription.findMany({
            where: {
                status: 'EXPIRED',
                endDate: { lt: now },
                member: { status: 'ACTIVE' },
            },
            select: { memberId: true },
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

        return NextResponse.json({
            success: true,
            subscriptionsExpired: expiredSubs.count,
            membersExpired,
            timestamp: now.toISOString(),
        })
    } catch (error) {
        console.error('[Cron:ExpireSubs] Fatal error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
