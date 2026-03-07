import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { z } from 'zod'
import { guardRateLimit } from '@/lib/rate-limit'
import { formatInTimeZone } from 'date-fns-tz'

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

        const roleCheck = await import('@/lib/auth').then(m => m.checkRole(auth, ['OWNER', 'STAFF', 'TRAINER']))
        if (roleCheck) return roleCheck

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

        // 2. Validate Timezone out-of-loop
        let validTimezone = auth.gym.timezone || 'Asia/Kolkata'
        try {
            formatInTimeZone(new Date(), validTimezone, 'yyyy-MM-dd')
        } catch (e) {
            console.warn(`[Sync-Offline] Invalid timezone ${validTimezone} for gym ${auth.gym.id}, falling back to Asia/Kolkata`)
            validTimezone = 'Asia/Kolkata'
        }

        const syncedIds: string[] = []

        // 3. Batch Processing for Data Integrity
        for (const record of records) {
            if (!validMemberIds.has(record.memberId)) continue;

            try {
                const checkInTimeDate = new Date(record.checkInTime)
                if (isNaN(checkInTimeDate.getTime())) {
                    throw new Error(`Invalid date: ${record.checkInTime}`)
                }

                let localDateString: string
                try {
                    localDateString = formatInTimeZone(checkInTimeDate, validTimezone, 'yyyy-MM-dd')
                } catch (e) {
                    const match = record.checkInTime.match(/([+-])(\d{2}):(\d{2})$/)
                    if (match) {
                        const sign = match[1] === '+' ? 1 : -1
                        const hours = parseInt(match[2], 10)
                        const mins = parseInt(match[3], 10)
                        const offsetMins = sign * (hours * 60 + mins)
                        const localTime = new Date(checkInTimeDate.getTime() + offsetMins * 60000)
                        localDateString = localTime.toISOString().split('T')[0]
                    } else {
                        console.warn(`[Sync-Offline] Cannot determine local date for ${record.checkInTime}, fallback to UTC`)
                        localDateString = checkInTimeDate.toISOString().split('T')[0]
                    }
                }

                // 3. Idempotent processing: Optimistic create to prevent TOCTOU race conditions
                try {
                    await prisma.attendance.create({
                        data: {
                            memberId: record.memberId,
                            gymId: auth.gym.id,
                            localDateString: localDateString,
                            checkInTime: record.checkInTime,
                            date: checkInTimeDate
                        }
                    })
                } catch (createErr: any) {
                    // P2002: Unique constraint failed
                    if (createErr.code === 'P2002') {
                        const existing = await prisma.attendance.findUnique({
                            where: {
                                memberId_localDateString: {
                                    memberId: record.memberId,
                                    localDateString: localDateString,
                                }
                            }
                        })

                        if (existing) {
                            const existingTime = new Date(existing.checkInTime)
                            if (checkInTimeDate < existingTime) {
                                await prisma.attendance.update({
                                    where: { id: existing.id },
                                    data: {
                                        checkInTime: record.checkInTime,
                                        date: checkInTimeDate
                                    }
                                })
                            }
                            syncedIds.push(record.id)
                        }
                    } else {
                        throw createErr
                    }
                }

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
