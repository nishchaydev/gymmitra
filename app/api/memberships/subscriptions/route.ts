import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { addDays } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { Prisma, PaymentStatus as PrismaPaymentStatus, SubscriptionStatus } from '@prisma/client'

const subscriptionSchema = z.object({
    memberId: z.string(),
    planId: z.string(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/, "ISO 8601 format required")
        .transform((str) => new Date(str)),
    price: z.number().optional(),
    paymentStatus: z.nativeEnum(PrismaPaymentStatus).default(PrismaPaymentStatus.PAID),
    discountReason: z.string().optional(),
})

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
        const validatedData = subscriptionSchema.parse(body)

        // Verify member belongs to this gym
        const member = await prisma.member.findFirst({
            where: { id: validatedData.memberId, gymId: gym.id }
        })

        if (!member) {
            return NextResponse.json({ error: 'Member not found or access denied' }, { status: 403 })
        }

        // Get plan details to calculate end date and price if not provided
        const plan = await prisma.membershipPlan.findFirst({
            where: { id: validatedData.planId, gymId: gym.id }
        })

        if (!plan) {
            return NextResponse.json(
                { error: 'Plan not found or access denied' },
                { status: 404 }
            )
        }

        const startDate = validatedData.startDate
        const endDate = addDays(startDate, plan.duration)
        const price = validatedData.price ?? Number(plan.price)

        // Validate override isn't suspiciously low (e.g., < 50% of plan price)
        if (validatedData.price !== undefined && validatedData.price < Number(plan.price) * 0.5) {
            console.warn(`Large discount applied for gym ${gym.id}: ${plan.price} → ${validatedData.price}. Reason: ${validatedData.discountReason || 'None'}`)
        }

        // Create subscription
        const subscription = await prisma.memberSubscription.create({
            data: {
                memberId: validatedData.memberId,
                planId: validatedData.planId,
                gymId: gym.id, // Direct gymId for multi-tenant isolation
                startDate,
                endDate,
                price,
                paymentStatus: validatedData.paymentStatus,
                status: 'ACTIVE',
                notes: validatedData.discountReason ? `Discount: ${validatedData.discountReason}` : null
            } as any
        })

        // Update member status to ACTIVE
        await prisma.member.update({
            where: { id: validatedData.memberId },
            data: { status: 'ACTIVE' }
        })

        return NextResponse.json(subscription, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
        }
        console.error('Subscription creation error:', error)
        return NextResponse.json(
            { error: 'Failed to create subscription' },
            { status: 500 }
        )
    }
}
