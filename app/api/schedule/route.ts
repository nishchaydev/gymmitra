import { NextRequest, NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { guardRateLimit, ConflictError } from '@/lib/rate-limit'
import { Prisma } from '@prisma/client'

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

        const roleCheck = checkRole(auth, ['OWNER', 'ADMIN', 'TRAINER'])
        if (roleCheck) return roleCheck

        let rl;
        try {
            rl = await guardRateLimit(100, `${auth.userId}:schedule:get`)
        } catch (err) {
            console.error('[Schedule GET] Rate limit infra failure:', err)
            return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
        }
        if (rl) return rl

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

        const roleCheck = checkRole(auth, ['OWNER', 'ADMIN', 'TRAINER'])
        if (roleCheck) return roleCheck

        let rl;
        try {
            rl = await guardRateLimit(100, `${auth.userId}:schedule:post`)
        } catch (err) {
            console.error('[Schedule POST] Rate limit infra failure:', err)
            return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 })
        }
        if (rl) return rl

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

        // Atomic transaction with SERIALIZABLE isolation to prevent TOCTOU
        const session = await withRetry(() => prisma.$transaction(async (tx) => {
            // 1. Ownership & Existence checks inside transaction
            const [trainer, member] = await Promise.all([
                tx.staffMember.findFirst({ where: { id: data.trainerId, gymId: auth.gym.id, role: 'TRAINER' } }),
                tx.member.findFirst({ where: { id: data.memberId, gymId: auth.gym.id } })
            ])

            if (!trainer) throw new Error('TRAINER_NOT_FOUND')
            if (!member) throw new Error('MEMBER_NOT_FOUND')

            // 2. Conflict check
            const conflictingSession = await tx.pTSession.findFirst({
                where: {
                    gymId: auth.gym.id,
                    status: { not: 'CANCELLED' },
                    OR: [
                        { trainerId: data.trainerId, startTime: { lt: data.endTime }, endTime: { gt: data.startTime } },
                        { memberId: data.memberId, startTime: { lt: data.endTime }, endTime: { gt: data.startTime } }
                    ]
                }
            })

            if (conflictingSession) {
                const victim = conflictingSession.trainerId === data.trainerId ? 'Trainer' : 'Member'
                throw new ConflictError(`${victim} already has a session overlapping this time`)
            }

            return tx.pTSession.create({
                data: {
                    ...data,
                    gymId: auth.gym.id,
                    status: 'SCHEDULED'
                }
            })
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }))

        return NextResponse.json(session, { status: 201 })
    } catch (error) {
        if (error instanceof ConflictError) {
            return NextResponse.json({ error: error.message }, { status: 409 })
        }
        if (error instanceof Error) {
            if (error.message === 'TRAINER_NOT_FOUND') {
                return NextResponse.json({ error: 'Trainer not found or unauthorized' }, { status: 404 })
            }
            if (error.message === 'MEMBER_NOT_FOUND') {
                return NextResponse.json({ error: 'Member not found or unauthorized' }, { status: 404 })
            }
        }
        console.error('[Schedule POST] Error:', error)
        return NextResponse.json({ error: 'Failed to schedule session' }, { status: 500 })
    }
}
