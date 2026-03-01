import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
    // 1. Verify CRON_SECRET
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
        console.error('[Cron:CleanupNotifications] CRON_SECRET not configured')
        return new Response('Server misconfigured', { status: 500 })
    }

    const authHeader = request.headers.get('authorization') || ''
    const expected = `Bearer ${cronSecret}`

    const hmacHeader = crypto.createHmac('sha256', cronSecret).update(authHeader).digest()
    const hmacExpected = crypto.createHmac('sha256', cronSecret).update(expected).digest()
    if (!crypto.timingSafeEqual(hmacHeader, hmacExpected)) {
        return new Response('Unauthorized', { status: 401 })
    }

    try {
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        const result = await prisma.notification.deleteMany({
            where: {
                createdAt: { lt: ninetyDaysAgo },
            },
        })

        console.log(`[Cron:CleanupNotifications] Deleted ${result.count} old notifications`)

        return NextResponse.json({
            success: true,
            deletedCount: result.count,
            olderThan: ninetyDaysAgo.toISOString(),
        })
    } catch (error) {
        console.error('[Cron:CleanupNotifications] Fatal error:', error)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
