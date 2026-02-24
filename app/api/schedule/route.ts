import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym } from '@/lib/auth'

const scheduleSchema = z.object({
    trainerId: z.string().min(1, "Trainer is required"),
    memberId: z.string().min(1, "Member is required"),
    startTime: z.string().transform(str => new Date(str)),
    endTime: z.string().transform(str => new Date(str)),
    notes: z.string().optional()
})

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const start = searchParams.get('start')
        const end = searchParams.get('end')

        // If trainerId is provided, filter by it (useful for trainer view)
        const trainerId = searchParams.get('trainerId')

        const whereClause: any = { gymId: auth.gym.id }

        if (start && end) {
            whereClause.startTime = { gte: new Date(start) }
            whereClause.endTime = { lte: new Date(end) }
        }

        if (trainerId) {
            whereClause.trainerId = trainerId
        }

        const sessions = await prisma.pTSession.findMany({
            where: whereClause,
            include: {
                trainer: { select: { name: true } },
                member: { select: { name: true } }
            },
            orderBy: { startTime: 'asc' }
        })

        return NextResponse.json(sessions)
    } catch (error) {
        console.error('Failed to fetch schedule:', error)
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const data = scheduleSchema.parse(body)

        // Conflict validation: Double booking
        // Check if the trainer already has a session overlapping this time
        const conflictingSession = await prisma.pTSession.findFirst({
            where: {
                gymId: auth.gym.id,
                trainerId: data.trainerId,
                status: { notIn: ['CANCELLED'] }, // Only check active/scheduled ones
                OR: [
                    {
                        // New session starts within an existing session
                        startTime: { lt: data.endTime },
                        endTime: { gt: data.startTime }
                    }
                ]
            }
        })

        if (conflictingSession) {
            return NextResponse.json({ error: 'Trainer is already booked during this time' }, { status: 409 })
        }

        const session = await prisma.pTSession.create({
            data: {
                ...data,
                gymId: auth.gym.id,
                status: 'SCHEDULED'
            }
        })

        return NextResponse.json(session, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
        }
        console.error('Failed to schedule session:', error)
        return NextResponse.json({ error: 'Failed to schedule session' }, { status: 500 })
    }
}
