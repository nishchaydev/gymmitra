import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { Prisma } from '@prisma/client'

const planSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    duration: z.number().min(1), // days
    price: z.number().min(0),
    features: z.array(z.string()).optional(),
})

async function getAuthenticatedGym() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return await prisma.gymProfile.findUnique({ where: { userId: user.id } })
}

export async function GET(request: NextRequest) {
    try {
        const gym = await getAuthenticatedGym()
        if (!gym) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const plans = await prisma.membershipPlan.findMany({
            where: {
                isActive: true,
                gymId: gym.id
            },
            orderBy: { price: 'asc' }
        })
        return NextResponse.json(plans)
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch plans' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const gym = await getAuthenticatedGym()
        if (!gym) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        let body;
        try {
            body = await request.json()
        } catch (e) {
            return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
        }

        const validatedData = planSchema.parse(body)

        const createData: Prisma.MembershipPlanCreateInput = {
            ...validatedData,
            gym: {
                connect: { id: gym.id }
            }
        }

        const plan = await prisma.membershipPlan.create({
            data: createData
        })

        return NextResponse.json(plan, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.issues },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to create plan' },
            { status: 500 }
        )
    }
}
