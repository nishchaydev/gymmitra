import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { addDays } from 'date-fns'

const subscriptionSchema = z.object({
    memberId: z.string(),
    planId: z.string(),
    startDate: z.string().transform(str => new Date(str)),
    price: z.number().optional(), // Allow override
    paymentStatus: z.enum(['PAID', 'PENDING', 'PARTIAL']).default('PAID'),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = subscriptionSchema.parse(body)

        // Get plan details to calculate end date and price if not provided
        const plan = await prisma.membershipPlan.findUnique({
            where: { id: validatedData.planId }
        })

        if (!plan) {
            return NextResponse.json(
                { error: 'Plan not found' },
                { status: 404 }
            )
        }

        const startDate = validatedData.startDate
        const endDate = addDays(startDate, plan.duration)
        const price = validatedData.price ?? Number(plan.price)

        // Create subscription
        const subscription = await prisma.memberSubscription.create({
            data: {
                memberId: validatedData.memberId,
                planId: validatedData.planId,
                startDate,
                endDate,
                price,
                paymentStatus: validatedData.paymentStatus as any, // zod enum vs prisma enum matching
                status: 'ACTIVE'
            }
        })

        // Update member status to ACTIVE
        await prisma.member.update({
            where: { id: validatedData.memberId },
            data: { status: 'ACTIVE' }
        })

        return NextResponse.json(subscription, { status: 201 })
    } catch (error) {
        console.error('Subscription creation error:', error)
        return NextResponse.json(
            { error: 'Failed to create subscription' },
            { status: 500 }
        )
    }
}
