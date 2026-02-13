import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

// Schema for member creation
const memberCreateSchema = z.object({
    name: z.string().min(2, "Name is required"),
    phone: z.string().min(10, "Phone number is required"),
    email: z.string().email().optional().or(z.literal('')),
    dateOfBirth: z.string()
        .refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .transform(str => new Date(str)),
    gymId: z.string().min(1, "Gym ID is required").optional(), // Optional since we get it from auth
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
    emergencyRelation: z.string().optional(),
})

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const gym = await prisma.gymProfile.findUnique({
            where: { userId: user.id }
        })

        if (!gym) {
            return NextResponse.json({ error: 'Gym profile not found' }, { status: 404 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        const members = await prisma.member.findMany({
            where: {
                gymId: gym.id,
                ...(status ? { status: status as any } : {}),
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(members)
    } catch (error) {
        console.error('Error fetching members:', error)
        return NextResponse.json(
            { error: 'Failed to fetch members' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const gym = await prisma.gymProfile.findUnique({
            where: { userId: user.id }
        })

        if (!gym) {
            return NextResponse.json({ error: 'Gym profile not found' }, { status: 404 })
        }

        const body = await request.json()

        // Validate input
        const validatedData = memberCreateSchema.parse(body)

        // Create member
        const member = await prisma.member.create({
            data: {
                name: validatedData.name,
                phone: validatedData.phone,
                email: validatedData.email || null,
                dateOfBirth: validatedData.dateOfBirth,
                gymId: gym.id, // Securely use the gymId from auth
                emergencyName: validatedData.emergencyName || '',
                emergencyPhone: validatedData.emergencyPhone || '',
                emergencyRelation: validatedData.emergencyRelation || '',
            } as any
        })

        return NextResponse.json(member, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.issues },
                { status: 400 }
            )
        }

        console.error('Error creating member:', error)
        // Check for unique constraint violation
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            return NextResponse.json(
                { error: 'Member with this phone number already exists' },
                { status: 409 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to create member' },
            { status: 500 }
        )
    }
}
