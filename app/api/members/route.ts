import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema for member creation
const memberCreateSchema = z.object({
    name: z.string().min(2, "Name is required"),
    phone: z.string().min(10, "Phone number is required"),
    email: z.string().email().optional().or(z.literal('')),
    dateOfBirth: z.string().transform(str => new Date(str)),
    gymId: z.string().min(1, "Gym ID is required"), // In real app, this comes from auth context
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
    emergencyRelation: z.string().optional(),
})

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')

        // In a real app, we would filter by gymId from the authenticated user
        const members = await prisma.member.findMany({
            where: {
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
                gymId: validatedData.gymId,
                emergencyName: validatedData.emergencyName || '',
                emergencyPhone: validatedData.emergencyPhone || '',
                emergencyRelation: validatedData.emergencyRelation || '',
            }
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
        if ((error as any).code === 'P2002') {
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
