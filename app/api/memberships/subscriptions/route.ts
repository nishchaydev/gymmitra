import { NextRequest, NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'
import { z } from 'zod'
import { addMonths } from 'date-fns'
import { getAuthGym, checkRole } from '@/lib/auth'
import { Prisma, SubscriptionStatus, MemberStatus, PaymentMethod } from '@prisma/client'
import { guardRateLimit } from '@/lib/rate-limit'
import { subscriptionSchema } from '@/src/modules/memberships/validator'
import { BillingRepository } from '@/src/modules/billing/repository'
import crypto from 'crypto'
import { getBaseUrl } from '@/lib/utils'

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const gym = auth.gym

        const rl = await guardRateLimit(20, `${auth.userId}:subscriptions:post`)
        if (rl) return rl

        const roleCheck = checkRole(auth, ['OWNER', 'MANAGER', 'STAFF', 'FRONT_DESK'])
        if (roleCheck) return roleCheck

        const body = await request.json()
        const validatedData = subscriptionSchema.parse(body)

        // Verify member belongs to this gym
        const member = await prisma.member.findFirst({
            where: { id: validatedData.memberId, gymId: gym.id }
        })

        if (!member) {
            return NextResponse.json({ error: 'Member not found or access denied' }, { status: 403 })
        }

        // Get plan details
        const plan = await prisma.membershipPlan.findFirst({
            where: { id: validatedData.planId, gymId: gym.id }
        })

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found or access denied' }, { status: 404 })
        }

        const startDate = validatedData.startDate
        const endDate = addMonths(startDate, plan.duration)
        const price = validatedData.price ?? Number(plan.price)

        // Block duplicate active subscription (allow upgrades via force: true)
        if (!validatedData.force) {
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

        // Warn on suspiciously large discounts
        if (validatedData.price !== undefined && validatedData.price < Number(plan.price) * 0.5) {
            console.warn(`Large discount applied for gym ${gym.id}: ${plan.price} → ${validatedData.price}. Reason: ${validatedData.discountReason || 'None'}`)
        }

        // Atomic transaction: Create subscription, update member status, AND create invoice
        let invoiceShareToken: string | undefined
        const [subscription] = await withRetry(() => prisma.$transaction(async (tx) => {
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

            // Create invoice atomically — no more missing invoices on renewal
            const invoiceNumber = await BillingRepository.generateInvoiceNumber(gym.id, tx)
            const shareToken = crypto.randomBytes(32).toString('hex')
            invoiceShareToken = shareToken
            const gymSettings = await tx.gymProfile.findFirst({ where: { id: gym.id }, select: { invoiceLinkExpiryDays: true } })
            const expiryDays = gymSettings?.invoiceLinkExpiryDays ?? 30
            const shareTokenExpiresAt = expiryDays > 0
                ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
                : null

            await BillingRepository.createInvoiceInTransaction({
                invoiceNumber,
                type: 'MEMBERSHIP',
                gymId: gym.id,
                memberId: validatedData.memberId,
                subscriptionId: sub.id,
                subtotal: price,
                taxAmount: 0,
                taxPercentage: 0,
                discount: 0,
                total: price,
                amountPaid: price,
                balanceDue: 0,
                paymentStatus: validatedData.paymentStatus,
                paymentMethod: 'CASH' as PaymentMethod, // Default; UI can be extended to pass this
                shareToken,
                shareTokenExpiresAt,
                issueDate: new Date(),
                dueDate: new Date(),
                items: [{
                    description: `${plan.name} Membership Renewal (${plan.duration} Months)`,
                    amount: price,
                    quantity: 1,
                    unitPrice: price,
                    gymId: gym.id,
                }]
            }, tx)

            return [sub]
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }))

        const gymSlug = gym.slug
        const invoiceUrl = invoiceShareToken
            ? `${getBaseUrl()}/${gymSlug}/invoice/${invoiceShareToken}`
            : undefined

        return NextResponse.json({
            ...subscription,
            invoiceUrl,
        }, { status: 201 })
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

