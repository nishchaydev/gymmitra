import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { z } from 'zod'

const syncSchema = z.object({
    records: z.array(z.object({
        id: z.string(), // The temp ID
        memberId: z.string(),
        date: z.string().transform(str => new Date(str)),
        checkInTime: z.string(),
        timestamp: z.number()
    }))
})

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { records } = syncSchema.parse(body)

        if (!records || records.length === 0) {
            return NextResponse.json({ syncedIds: [] })
        }

        const syncedIds: string[] = []

        // Process sequentially to handle unique constraints properly
        for (const record of records) {
            try {
                // Ensure member belongs to this gym
                const member = await prisma.member.findFirst({
                    where: { id: record.memberId, gymId: auth.gym.id }
                })

                if (!member) continue; // Skip invalid members gracefully

                // Strip time from date to check uniqueness safely
                const targetDate = new Date(record.date);
                targetDate.setHours(0, 0, 0, 0);

                // Upsert to handle multiple offline attempts creating duplicate key errors
                await prisma.attendance.upsert({
                    where: {
                        memberId_date: {
                            memberId: record.memberId,
                            date: targetDate,
                        }
                    },
                    update: { // It was already synced earlier possibly, just update time
                        checkInTime: record.checkInTime
                    },
                    create: {
                        memberId: record.memberId,
                        gymId: auth.gym.id,
                        date: targetDate,
                        checkInTime: record.checkInTime
                    }
                })

                syncedIds.push(record.id)
            } catch (err) {
                console.error(`Failed to sync individual record ${record.id}:`, err)
                // We continue so other valid records still sync
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
