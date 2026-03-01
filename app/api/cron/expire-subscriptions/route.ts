import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
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

        for (const sub of expiredMemberSubs) {
            // Check if this member has any OTHER active subscriptions
            const activeSubCount = await prisma.memberSubscription.count({
                where: {
                    memberId: sub.memberId,
                    status: 'ACTIVE',
                },
            })

            if (activeSubCount === 0) {
                await prisma.member.update({
                    where: { id: sub.memberId },
                    data: { status: 'EXPIRED' },
                })
                membersExpired++
            }
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
