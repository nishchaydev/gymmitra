import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym } from '@/lib/auth'

const memberUpdateSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(10).optional(),
    email: z.string().email().optional().or(z.literal('')),
    dateOfBirth: z.string().transform(str => new Date(str)).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED']).optional(),
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
    emergencyRelation: z.string().optional(),
    notes: z.string().optional(),
})

async function getAuthenticatedGym() {
    const auth = await getAuthGym()
    return auth ? auth.gym : null
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const gym = await getAuthenticatedGym()
        if (!gym) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const member = await prisma.member.findFirst({
            where: {
                id,
                gymId: gym.id // Security Check
            },
            include: {
                subscriptions: {
                    include: { plan: true },
                    orderBy: { endDate: 'desc' }
                },
                invoices: {
                    orderBy: { issueDate: 'desc' },
                    take: 5
                }
            }
        })

        if (!member) {
            return NextResponse.json(
                { error: 'Member not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(member)
    } catch (error) {
        console.error('Error fetching member:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const gym = await getAuthenticatedGym()
        if (!gym) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()
        const validatedData = memberUpdateSchema.parse(body)

        // Ensure member belongs to gym before updating
        const count = await prisma.member.count({ where: { id, gymId: gym.id } })
        if (count === 0) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

        const member = await prisma.member.update({
            where: { id },
            data: validatedData
        })

        return NextResponse.json(member)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.issues },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to update member' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const gym = await getAuthenticatedGym()
        if (!gym) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params

        // Use deleteMany to verify ownership implicitly (deleteMany returns count)
        // actually delete via correct where clause
        const result = await prisma.member.deleteMany({
            where: {
                id,
                gymId: gym.id
            }
        })

        if (result.count === 0) {
            return NextResponse.json({ error: 'Member not found or unauthorized' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to delete member' },
            { status: 500 }
        )
    }
}
