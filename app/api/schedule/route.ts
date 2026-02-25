import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym } from '@/lib/auth'
import { apiLimiter, RateLimitError } from '@/lib/rate-limit'

const scheduleSchema = z.object({
    trainerId: z.string().min(1, "Trainer is required"),
    memberId: z.string().min(1, "Member is required"),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    notes: z.string().optional()
}).refine(data => data.endTime > data.startTime, {
    message: "End time must be after start time",
    path: ["endTime"]
})

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        try { await apiLimiter.check(100, `${auth.userId}:schedule:get`) } catch (e) {
            if (e instanceof RateLimitError) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
            throw e
        }

        const { searchParams } = new URL(request.url)
        const start = searchParams.get('start')
        const end = searchParams.get('end')
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
        console.error('[Schedule GET] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        try { await apiLimiter.check(20, `${auth.userId}:schedule:post`) } catch (e) {
            if (e instanceof RateLimitError) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
            throw e
        }

        let body;
        try {
            body = await request.json()
        } catch (e) {
            return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 })
        }

        const result = scheduleSchema.safeParse(body)
        if (!result.success) {
            return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 })
        }
        const data = result.data

        // 1. Ownership & Existence Verification
        const [trainer, member] = await Promise.all([
            prisma.staffMember.findFirst({ where: { id: data.trainerId, gymId: auth.gym.id, role: 'TRAINER' } }),
            prisma.member.findFirst({ where: { id: data.memberId, gymId: auth.gym.id } })
        ])

        if (!trainer) return NextResponse.json({ error: 'Trainer not found or unauthorized' }, { status: 404 })
        if (!member) return NextResponse.json({ error: 'Member not found or unauthorized' }, { status: 404 })

        // 2. Atomic transaction: conflict check + create (prevents TOCTOU race condition)
        const session = await prisma.$transaction(async (tx) => {
            const conflictingSession = await tx.pTSession.findFirst({
                where: {
                    gymId: auth.gym.id,
                    status: { notIn: ['CANCELLED'] },
                    OR: [
                        { trainerId: data.trainerId, startTime: { lt: data.endTime }, endTime: { gt: data.startTime } },
                        { memberId: data.memberId, startTime: { lt: data.endTime }, endTime: { gt: data.startTime } }
                    ]
                }
            })

            if (conflictingSession) {
                const victim = conflictingSession.trainerId === data.trainerId ? 'Trainer' : 'Member'
                throw new Error(`CONFLICT:${victim} already has a session overlapping this time`)
            }

            return tx.pTSession.create({
                data: {
                    ...data,
                    gymId: auth.gym.id,
                    status: 'SCHEDULED'
                }
            })
        })

        return NextResponse.json(session, { status: 201 })
    } catch (error) {
        if (error instanceof Error && error.message.startsWith('CONFLICT:')) {
            return NextResponse.json({ error: error.message.replace('CONFLICT:', '') }, { status: 409 })
        }
        console.error('[Schedule POST] Error:', error)
        return NextResponse.json({ error: 'Failed to schedule session' }, { status: 500 })
    }
}
