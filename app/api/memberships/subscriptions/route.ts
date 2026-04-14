import { NextRequest, NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/prisma'
import { z } from 'zod'
import { addMonths } from 'date-fns'
import { getAuthGym, checkRole } from '@/lib/auth'
import { Prisma, SubscriptionStatus, MemberStatus, PaymentMethod } from '@prisma/client'
import { guardRateLimit } from '@/lib/rate-limit'
import { subscriptionSchema } from '@/src/modules/memberships/validator'
import { BillingService } from '@/src/modules/billing/service'
import { invalidateCache, cacheKey } from '@/lib/redis-cache'
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

        let startDate = validatedData.startDate
        
        // --- Subscription Stacking Logic ---
        // Find the latest active subscription for this member
        const currentSub = await prisma.memberSubscription.findFirst({
            where: {
                memberId: validatedData.memberId,
                gymId: gym.id,
                status: SubscriptionStatus.ACTIVE,
                endDate: { gte: new Date() }
            },
            orderBy: { endDate: 'desc' }
        })

        // If an active subscription exists and extends past the requested start date, stack from the end date
        if (currentSub && currentSub.endDate > startDate) {
            startDate = currentSub.endDate
        }

        const endDate = addMonths(startDate, plan.duration)
        const price = validatedData.price ?? Number(plan.price)

        // Block duplicate active subscriptions if start dates overlap (unless forced)
        // Note: With stacking, startDate is shifted, so this protects against identical end dates or edge cases.
        if (!validatedData.force) {
            const duplicateActive = await prisma.memberSubscription.findFirst({
                where: {
                    memberId: validatedData.memberId,
                    gymId: gym.id,
                    status: SubscriptionStatus.ACTIVE,
                    endDate: { gte: startDate }
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

            // Create invoice atomically via unified BillingService
            const ipHeader = request.headers.get('x-forwarded-for')
            const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

            const invoiceResult = await BillingService.createInvoice(
                gym,
                {
                    memberId: validatedData.memberId,
                    subscriptionId: sub.id,
                    type: 'RENEWAL',
                    items: [{
                        description: `${plan.name} Membership Renewal (${plan.duration} Months)`,
                        quantity: 1,
                        unitPrice: price,
                        type: 'MEMBERSHIP'
                    }],
                    paymentMethod: validatedData.paymentMethod as any,
                    paymentStatus: validatedData.paymentStatus as any,
                    amountPaid: validatedData.amountPaid,
                    discount: 0,
                },
                auth.userId,
                ip,
                tx
            )

            if (!invoiceResult.success) {
                throw new Error(invoiceResult.error || "Failed to create subscription invoice")
            }

            const invoice = await tx.invoice.findUnique({ where: { id: invoiceResult.id } })
            invoiceShareToken = invoice?.shareToken || undefined

            return [sub]
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }))

        const gymSlug = gym.slug
        const invoiceUrl = invoiceShareToken
            ? `${getBaseUrl()}/${gymSlug}/invoice/${invoiceShareToken}`
            : undefined

        // ── Cache invalidation ────────────────────────────────────────────
        // A new subscription changes: member status, renewals list, at-risk list
        // Bust all possible variants so next request fetches fresh from Supabase
        const keysToInvalidate = [
            cacheKey.renewals(gym.id),
            cacheKey.membersCount(gym.id)
        ]
        
        const atRiskThresholds = [7, 14, 30]
        const listStatuses = ['ALL', 'ACTIVE', 'INACTIVE', 'EXPIRED']
        
        atRiskThresholds.forEach(days => {
            keysToInvalidate.push(cacheKey.atRisk(gym.id, days))
        })
        listStatuses.forEach(status => {
            keysToInvalidate.push(cacheKey.membersList(gym.id, `${status}:ALL:p1:t10`))
        })

        invalidateCache(...keysToInvalidate).catch((err) => {
            console.error('[Subscriptions POST] Redis cache invalidation failed:', err)
        })

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

