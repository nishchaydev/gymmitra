import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { z } from 'zod'
import { apiLimiter, RateLimitError } from '@/lib/rate-limit'

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

        try { await apiLimiter.check(20, `${auth.userId}:sync-offline:post`) } catch (e) {
            if (e instanceof RateLimitError) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
            throw e
        }

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

        // 2. Batch Processing for Data Integrity
        for (const record of records) {
            if (!validMemberIds.has(record.memberId)) continue;

            try {
                // Normalize date for uniqueness (YYYY-MM-DD)
                const checkInDateNormalized = record.date.toISOString().split('T')[0]

                // Upsert to handle offline retries
                await prisma.attendance.upsert({
                    where: {
                        memberId_checkInDate: {
                            memberId: record.memberId,
                            checkInDate: checkInDateNormalized,
                        }
                    },
                    update: {
                        checkInTime: record.checkInTime,
                        updatedAt: new Date()
                    },
                    create: {
                        memberId: record.memberId,
                        gymId: auth.gym.id,
                        checkInDate: checkInDateNormalized,
                        checkInTime: record.checkInTime,
                        date: record.date
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
