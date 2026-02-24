import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym } from '@/lib/auth'
import { SessionStatus } from '@prisma/client'

const updateSchema = z.object({
    status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
    startTime: z.string().transform(str => new Date(str)).optional(),
    endTime: z.string().transform(str => new Date(str)).optional(),
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

        const params = await props.params;
        const body = await request.json()
        const data = updateSchema.parse(body)

        // Ensure session belongs to gym
        const session = await prisma.pTSession.findFirst({
            where: { id: params.id, gymId: auth.gym.id }
        })

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        // Conflict validation if times are changing
        if (data.startTime && data.endTime) {
            const conflictingSession = await prisma.pTSession.findFirst({
                where: {
                    gymId: auth.gym.id,
                    trainerId: session.trainerId,
                    id: { not: session.id }, // Exclude current session
                    status: { notIn: ['CANCELLED'] },
                    OR: [
                        {
                            startTime: { lt: data.endTime },
                            endTime: { gt: data.startTime }
                        }
                    ]
                }
            })

            if (conflictingSession) {
                return NextResponse.json({ error: 'Trainer is already booked during this new time' }, { status: 409 })
            }
        }

        const updatedSession = await prisma.pTSession.update({
            where: { id: params.id },
            data
        })

        return NextResponse.json(updatedSession)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
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

        const params = await props.params;

        // Ensure session belongs to gym
        const session = await prisma.pTSession.findFirst({
            where: { id: params.id, gymId: auth.gym.id }
        })

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 })
        }

        await prisma.pTSession.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ message: 'Session removed successfully' })
    } catch (error) {
        console.error('Failed to delete session:', error)
        return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
    }
}
