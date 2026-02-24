import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym } from '@/lib/auth'

const staffSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address").toLowerCase(),
    phone: z.string().regex(/^\+?[\d\s-]{10,}$/, "Invalid phone format").optional(),
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
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true
                // userId excluded to prevent leak of Supabase UUID placeholders
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(staffMembers)
    } catch (error) {
        console.error('[Staff GET] Error:', error)
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
        const result = staffSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 })
        }
        const validatedData = result.data

        // Atomic check via try-catch on P2002 is safer against race conditions
        // but we keep the explicit check for better UX
        const existingStaff = await prisma.staffMember.findFirst({
            where: { email: validatedData.email, gymId: auth.gym.id }
        })

        if (existingStaff) {
            return NextResponse.json({ error: 'A staff member with this email already exists in your gym' }, { status: 400 })
        }

        const newStaff = await prisma.staffMember.create({
            data: {
                ...validatedData,
                gymId: auth.gym.id,
                userId: `pending_${crypto.randomUUID()}`,
                isActive: false
            }
        })

        return NextResponse.json(newStaff, { status: 201 })
    } catch (error) {
        // Catch Prisma unique constraint violation if race condition occurs
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
        }
        console.error('[Staff POST] Error:', error)
        return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
    }
}
