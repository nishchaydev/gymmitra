import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { guardRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
    // Basic rate limit for cron to prevent DDOS attempts against the URL
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const rawIp = realIp || forwardedFor || '127.0.0.1'
    const ip = rawIp.split(',')[0].trim() || '127.0.0.1'

    const rl = await guardRateLimit(5, `cron:cleanup:${ip}`, false)
    if (rl) return rl

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
