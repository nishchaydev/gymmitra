import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { addDays } from 'date-fns'
import { getAuthGym } from '@/lib/auth'
import { Prisma, PaymentStatus as PrismaPaymentStatus, SubscriptionStatus, MemberStatus } from '@prisma/client'

const subscriptionSchema = z.object({
    memberId: z.string().min(1, "Member ID is required"),
    planId: z.string().min(1, "Plan ID is required"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/, "ISO 8601 format required")
        .transform((str) => new Date(str)),
    price: z.number().min(0, "Price cannot be negative").optional(),
    paymentStatus: z.nativeEnum(PrismaPaymentStatus).default(PrismaPaymentStatus.PAID),
    discountReason: z.string().optional(),
    // force=true bypasses the same-plan duplicate check (e.g. extending an active sub)
    force: z.boolean().optional().default(false),
})

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const gym = auth.gym

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

        // Block duplicate active subscription (allow upgrades via force: true)
        if (!validatedData.force) {
            const isRenewal = validatedData.startDate > new Date()
            const duplicateActive = await prisma.memberSubscription.findFirst({
                where: {
                    memberId: validatedData.memberId,
                    gymId: gym.id,
                    status: SubscriptionStatus.ACTIVE,
                    endDate: { gte: validatedData.startDate }
                }
            })

            if (duplicateActive) {
                return NextResponse.json(
                    {
                        error: 'Member already has an overlapping active subscription.',
                        hint: 'To override (e.g. extension/manual upgrade), resend with force: true.',
                        existingEndDate: duplicateActive.endDate
                    },
                    { status: 409 }
                )
            }
        }

        // Validate override isn't suspiciously low (e.g., < 50% of plan price)
        if (validatedData.price !== undefined && validatedData.price < Number(plan.price) * 0.5) {
            console.warn(`Large discount applied for gym ${gym.id}: ${plan.price} → ${validatedData.price}. Reason: ${validatedData.discountReason || 'None'}`)
        }

        // Atomic transaction: Create subscription AND update member status
        const [subscription] = await prisma.$transaction(async (tx) => {
            const sub = await tx.memberSubscription.create({
                data: {
                    memberId: validatedData.memberId,
                    planId: validatedData.planId,
                    gymId: gym.id,
                    startDate,
                    endDate,
                    price,
                    paymentStatus: validatedData.paymentStatus,
                    status: SubscriptionStatus.ACTIVE,
                    notes: validatedData.discountReason ? `Discount: ${validatedData.discountReason}` : null
                }
            })

            await tx.member.update({
                where: { id: validatedData.memberId },
                data: { status: MemberStatus.ACTIVE }
            })

            return [sub]
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
