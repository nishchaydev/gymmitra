import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym } from '@/lib/auth'

const staffSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().optional(),
    role: z.enum(['STAFF', 'TRAINER']),
})

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth || auth.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const staffMembers = await prisma.staffMember.findMany({
            where: { gymId: auth.gym.id },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(staffMembers)
    } catch (error) {
        console.error('Failed to fetch staff members:', error)
        return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth || auth.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const validatedData = staffSchema.parse(body)

        // Check if staff email already exists for this gym
        const existingStaff = await prisma.staffMember.findFirst({
            where: { email: validatedData.email, gymId: auth.gym.id }
        })

        if (existingStaff) {
            return NextResponse.json({ error: 'Staff member with this email already exists in your gym' }, { status: 400 })
        }

        const newStaff = await prisma.staffMember.create({
            data: {
                ...validatedData,
                gymId: auth.gym.id,
                userId: `pending_${Math.random().toString(36).substring(7)}`, // Placeholder
                isActive: false // Pending until they sign up
            }
        })

        return NextResponse.json(newStaff, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
        }
        console.error('Failed to create staff member:', error)
        return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
    }
}
