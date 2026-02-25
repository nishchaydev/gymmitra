import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { z } from 'zod'
import { guardRateLimit } from '@/lib/rate-limit'

const syncSchema = z.object({
    records: z.array(z.object({
        id: z.string(), // The temp ID
        memberId: z.string(),
        date: z.coerce.date(),
        checkInTime: z.string(),
        timestamp: z.number()
    })).max(1000)
})

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        let rl;
        try {
            rl = await guardRateLimit(20, `${auth.userId}:sync-offline:post`, false)
        } catch (err) {
            console.error('[Sync-Offline] Rate limiter infra failure. Failing closed:', err)
            return NextResponse.json({ error: 'Service Unavailable' }, { status: 503 })
        }
        if (rl) return rl

        const body = await request.json()
        const result = syncSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid payload', details: result.error.format() }, { status: 400 })
        }

        const { records } = result.data

        if (records.length === 0) {
            return NextResponse.json({ syncedIds: [] })
        }

        // 1. Batch Member Lookup (Fix N+1)
        const memberIds = [...new Set(records.map(r => r.memberId))]
        const members = await prisma.member.findMany({
            where: {
                id: { in: memberIds },
                gymId: auth.gym.id
            },
            select: { id: true }
        })
        const validMemberIds = new Set(members.map(m => m.id))

        const syncedIds: string[] = []

        const { formatInTimeZone } = await import('date-fns-tz')

        // 2. Batch Processing for Data Integrity
        for (const record of records) {
            if (!validMemberIds.has(record.memberId)) continue;

            try {
                // Normalize date securely using the gym's specific timezone
                const checkInTimeDate = new Date(record.checkInTime)
                const timezone = auth.gym.timezone || 'Asia/Kolkata'
                const localDateString = formatInTimeZone(checkInTimeDate, timezone, 'yyyy-MM-dd')

                // Upsert to handle offline retries
                await prisma.attendance.upsert({
                    where: {
                        memberId_localDateString: {
                            memberId: record.memberId,
                            localDateString: localDateString,
                        }
                    },
                    update: {
                        checkInTime: record.checkInTime,
                        updatedAt: new Date()
                    },
                    create: {
                        memberId: record.memberId,
                        gymId: auth.gym.id,
                        localDateString: localDateString,
                        checkInTime: record.checkInTime,
                        date: checkInTimeDate
                    }
                })

                syncedIds.push(record.id)
            } catch (err) {
                console.error(`[Sync] Failed record ${record.id}:`, err instanceof Error ? err.message : String(err))
            }
        }

        return NextResponse.json({
            success: true,
            syncedCount: syncedIds.length,
            syncedIds
        })
    } catch (error) {
        console.error('Failed to sync offline attendance:', error)
        return NextResponse.json(
            { error: 'Failed to process sync batch' },
            { status: 500 }
        )
    }
}
