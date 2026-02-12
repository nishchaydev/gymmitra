import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const planSchema = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    duration: z.number().min(1), // days
    price: z.number().min(0),
    features: z.array(z.string()).optional(),
    gymId: z.string().min(1),
})

export async function GET(request: NextRequest) {
    try {
        const plans = await prisma.membershipPlan.findMany({
            where: { isActive: true },
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
        const body = await request.json()
        const validatedData = planSchema.parse(body)

        const plan = await prisma.membershipPlan.create({
            data: validatedData
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
