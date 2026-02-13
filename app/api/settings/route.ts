import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const settingsSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(10, "Phone number is required"),
    address: z.string().optional(),
    gst: z.string().optional(),
    invoicePrefix: z.string().min(1).max(5).optional(),
})

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const gymProfile = await prisma.gymProfile.findUnique({
            where: { userId: user.id }
        })

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
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const data = settingsSchema.parse(body)

        const gymProfile = await prisma.gymProfile.upsert({
            where: { userId: user.id },
            update: data,
            create: {
                ...data,
                userId: user.id,
            },
        })

        return NextResponse.json(gymProfile)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
