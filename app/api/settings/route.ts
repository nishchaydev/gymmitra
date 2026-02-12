import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const settingsSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(10, "Phone number is required"),
    address: z.string().optional(),
    gst: z.string().optional(),
})

export async function GET() {
    try {
        // For now, fetch the "default" gym profile
        // In future, this will come from session/auth
        const gymProfile = await prisma.gymProfile.findFirst()

        if (!gymProfile) {
            return NextResponse.json({ error: 'Gym profile not found' }, { status: 404 })
        }

        return NextResponse.json(gymProfile)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json()
        const data = settingsSchema.parse(body)

        // For now, update the "default" gym profile
        // We know it exists because of seeding, or we create it if missing
        const existingProfile = await prisma.gymProfile.findFirst()

        const gymProfile = await prisma.gymProfile.upsert({
            where: { id: existingProfile?.id || 'default-gym-id' },
            create: {
                ...data,
                id: 'default-gym-id',
                userId: 'default_user', // reliable default for now
            },
            update: data,
        })

        return NextResponse.json(gymProfile)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
