import { NextRequest, NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym } from '@/lib/auth'
import { SessionStatus, Prisma } from '@prisma/client'
import { guardRateLimit, ConflictError } from '@/lib/rate-limit'
import { optionalDateField } from '@/lib/date-validation'

const updateSchema = z.object({
    status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
    startTime: optionalDateField('startTime'),
    endTime: optionalDateField('endTime'),
    notes: z.string().optional()
})

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getAuthGym()
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const rl = await guardRateLimit(50, `${auth.userId}:schedule:patch`)
        if (rl) return rl

        const params = await props.params;
        const body = await request.json()
        const data = updateSchema.parse(body)

        // Atomic transaction: ownership + conflict + update
        const updatedSession = await withRetry(() => prisma.$transaction(async (tx) => {
            const session = await tx.pTSession.findFirst({
                where: { id: params.id, gymId: auth.gym.id }
            })

            if (!session) {
                throw new Error('SESSION_NOT_FOUND')
            }

            // Conflict check when either time boundary changes (fallback to existing)
            if (data.startTime || data.endTime) {
                const newStart = data.startTime ?? session.startTime
                const newEnd = data.endTime ?? session.endTime

                if (newStart.getTime() >= newEnd.getTime()) {
                    throw new z.ZodError([{
                        code: z.ZodIssueCode.custom,
                        path: ['endTime'],
                        message: 'End time must be after start time'
                    }])
                }

                const conflictingSession = await tx.pTSession.findFirst({
                    where: {
                        gymId: auth.gym.id,
                        trainerId: session.trainerId,
                        id: { not: session.id },
                        status: { not: 'CANCELLED' },
                        startTime: { lt: newEnd },
                        endTime: { gt: newStart }
                    }
                })

                if (conflictingSession) {
                    throw new ConflictError('Trainer is already booked during this new time')
                }
            }

            return tx.pTSession.update({
                where: { id: params.id },
                data
            })
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 15000, maxWait: 10000 }))

        return NextResponse.json(updatedSession)
    } catch (error) {
        // ZodError first (more specific)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
        }
        if (error instanceof ConflictError) {
            return NextResponse.json({ error: error.message }, { status: 409 })
        }
        if (error instanceof Error && error.message === 'SESSION_NOT_FOUND') {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }
        console.error('Failed to update session:', error)
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getAuthGym()
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const rl = await guardRateLimit(50, `${auth.userId}:schedule:delete`)
        if (rl) return rl

        const params = await props.params;

        // Atomic delete with ownership check (avoids TOCTOU)
        const result = await prisma.pTSession.deleteMany({
            where: { id: params.id, gymId: auth.gym.id }
        })

        if (result.count === 0) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        return NextResponse.json({ message: 'Session removed successfully' })
    } catch (error) {
        console.error('Failed to delete session:', error)
        return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
    }
}
