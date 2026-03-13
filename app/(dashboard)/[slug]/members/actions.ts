'use server'

import { redirect } from 'next/navigation'
import { withAuth } from '@/lib/with-auth'

import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { recordAuditLog } from '@/lib/audit-logger'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { Resend } from 'resend'
import { WelcomeEmail } from '@/components/emails/WelcomeEmail'
import { render } from '@react-email/render'
import React from 'react'
import { format, parseISO, isValid, addDays } from 'date-fns'
import { Prisma, PaymentStatus, SubscriptionStatus } from '@prisma/client'
import { generateInvoiceNumber } from '@/lib/invoice-server-utils'
import { after } from 'next/server'

const memberSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    email: z.string().email().optional().or(z.literal('')),
    dateOfBirth: z.string()
        .refine(val => !isNaN(Date.parse(val)), { message: "Invalid date format" })
        .transform(str => new Date(str)),
    pincode: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
    emergencyRelation: z.string().optional(),
    planId: z.string().optional().or(z.literal('none')),
    paymentMethod: z.enum(["CASH", "UPI", "CARD", "OTHER"]).optional(),
    customPrice: z.number().nonnegative().optional(),
    discount: z.number().nonnegative().optional().default(0),
    amountPaid: z.number().nonnegative().optional(),
})

export const createMember = withAuth(async (context, data: z.input<typeof memberSchema>) => {
    const parsed = memberSchema.safeParse(data)
    if (!parsed.success) {
        return { error: parsed.error.issues[0]?.message || 'Validation failed' }
    }

    const validatedData = parsed.data
    const gymId = context.gym.id
    const slug = context.gym.slug

    try {
        const existingMember = await prisma.member.findFirst({
            where: { phone: validatedData.phone, gymId }
        })
        if (existingMember) return { error: 'Member with this phone number already exists in your gym.' }

        let finalMemberId: string = ""
        let finalInvoiceId: string | undefined = undefined

        await prisma.$transaction(async (tx) => {
            // Capitalize first letter of every word, including after hyphens and apostrophes
            const formattedName = validatedData.name
                .split(' ')
                .map(word =>
                    word.replace(/([^-']+)/g, (segment) =>
                        segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
                    )
                )
                .join(' ')

            // 1. Create the Member
            const member = await tx.member.create({
                data: {
                    name: formattedName,
                    phone: validatedData.phone,
                    email: validatedData.email || null,
                    dateOfBirth: validatedData.dateOfBirth,
                    gymId,
                    status: 'ACTIVE',
                    pincode: validatedData.pincode,
                    state: validatedData.state,
                    city: validatedData.city,
                    emergencyName: validatedData.emergencyName || '',
                    emergencyPhone: validatedData.emergencyPhone || '',
                    emergencyRelation: validatedData.emergencyRelation || '',
                }
            })
            finalMemberId = member.id

            // 2. If a Plan is Selected, Create Subscription and Invoice
            if (validatedData.planId && validatedData.planId !== 'none') {
                const plan = await tx.membershipPlan.findUnique({
                    where: { id: validatedData.planId }
                })

                if (!plan) throw new Error("Selected plan not found")

                const startDate = new Date()
                const endDate = addDays(startDate, plan.duration)
                const paymentMethod = (validatedData.paymentMethod || 'CASH') as PaymentStatus

                const planPrice = (validatedData.customPrice !== undefined && validatedData.customPrice > 0) ? validatedData.customPrice : Number(plan.price)
                const discount = validatedData.discount || 0
                const total = Math.max(0, planPrice - discount)
                let amountPaid = validatedData.amountPaid ?? total
                const balanceDue = Math.max(0, total - amountPaid)

                let paymentStatus: PaymentStatus = 'PAID'
                if (balanceDue > 0 && amountPaid > 0) {
                    paymentStatus = 'PARTIAL'
                } else if (amountPaid === 0 && total > 0) {
                    paymentStatus = 'PENDING'
                }

                // Create the physical subscription linkage
                const subscription = await tx.memberSubscription.create({
                    data: {
                        memberId: member.id,
                        planId: plan.id,
                        gymId,
                        startDate,
                        endDate,
                        price: plan.price,
                        status: 'ACTIVE' as SubscriptionStatus,
                        paymentStatus: paymentStatus
                    }
                })

                // Generate Invoice
                const invoiceNumber = await generateInvoiceNumber(gymId, tx)
                const shareToken = crypto.randomBytes(32).toString('hex')
                const expiryDays = context.gym.invoiceLinkExpiryDays ?? 30
                const shareTokenExpiresAt = expiryDays > 0
                    ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
                    : null

                const invoice = await tx.invoice.create({
                    data: {
                        invoiceNumber,
                        gymId,
                        memberId: member.id,
                        subscriptionId: subscription.id,
                        subtotal: planPrice,
                        taxAmount: 0,
                        taxPercentage: 0,
                        discount: discount,
                        total: total,
                        amountPaid: amountPaid,
                        balanceDue: balanceDue,
                        paymentStatus: paymentStatus,
                        paymentMethod: (validatedData.paymentMethod || 'CASH') as any,
                        issueDate: new Date(),
                        dueDate: new Date(),
                        type: 'MEMBERSHIP',
                        shareToken: shareToken,
                        shareTokenExpiresAt: shareTokenExpiresAt,
                        items: {
                            create: [{
                                description: `${plan.name} Membership (${plan.duration} Months)`,
                                amount: planPrice,
                                quantity: 1,
                                unitPrice: planPrice,
                                gymId: gymId,
                            }]
                        }
                    }
                })

                finalInvoiceId = invoice.id
            }
        })

        revalidatePath(`/${slug}/members`)
        revalidatePath(`/${slug}/invoices`)
        revalidatePath(`/${slug}/dashboard`)

        // 4. Audit Log
        const headerList = await headers()
        const ipHeader = headerList.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

        await recordAuditLog({
            gymId,
            actorId: context.userId,
            action: 'CREATE_MEMBER',
            entityType: 'MEMBER',
            entityId: finalMemberId,
            ipAddress: ip,
            payload: { name: validatedData.name, planId: validatedData.planId }
        }).catch(err => console.error('recordAuditLog CREATE_MEMBER', err))

        // 5. Send Welcome Email — now only sent if an email is provided
        after(async () => {
            if (validatedData.email && validatedData.email.length > 0) {
                try {
                    const resendKey = process.env.RESEND_API_KEY
                    if (!resendKey) {
                        console.error('[WelcomeEmail] RESEND_API_KEY not set — skipping email')
                        return
                    }

                    const resend = new Resend(resendKey)
                    const gym = context.gym

                    const latestSub = await prisma.memberSubscription.findFirst({
                        where: { memberId: finalMemberId, gymId },
                        include: { plan: true },
                        orderBy: { createdAt: 'desc' }
                    })

                    const { templates, getWhatsAppLink } = await import('@/lib/whatsapp')
                    const { getBaseUrl } = await import('@/lib/utils')

                    let publicInvoiceUrl: string | undefined = undefined
                    if (finalInvoiceId) {
                        const inv = await prisma.invoice.findUnique({
                            where: { id: finalInvoiceId },
                            select: { shareToken: true, gym: { select: { slug: true } } }
                        })
                        if (inv?.shareToken) {
                            publicInvoiceUrl = `${getBaseUrl()}/${inv.gym.slug}/invoice/${inv.shareToken}`
                        }
                    }

                    const invoiceUrl = publicInvoiceUrl

                    const { error } = await resend.emails.send({
                        from: `${gym.name} <hello@mail.emitra.dev>`,
                        to: validatedData.email,
                        subject: `Welcome to ${gym.name}, ${validatedData.name}!`,
                        react: React.createElement(WelcomeEmail, {
                            gymName: gym.name,
                            gymLogo: gym.logoUrl || gym.logo,
                            memberName: validatedData.name,
                            planName: latestSub?.plan.name || 'Pay-as-you-go',
                            expiryDate: latestSub?.endDate ? format(latestSub.endDate, 'PPP') : 'Contact Gym',
                            gymAddress: gym.address,
                            gymContact: gym.phone,
                            invoiceUrl: invoiceUrl,
                            termsAndConditions: gym.termsAndConditions,
                            gymRules: gym.gymRules
                        }) as React.ReactElement
                    })

                    if (error) console.error('[WelcomeEmail] Resend error:', JSON.stringify(error))
                    else console.log('[WelcomeEmail] Sent successfully to', validatedData.email)
                } catch (err) {
                    console.error('[WelcomeEmail] Logic error:', err)
                }
            }
        })

        const { templates, getWhatsAppLink } = await import('@/lib/whatsapp')

        let publicInvoiceUrl: string | undefined = undefined

        if (finalInvoiceId) {
            const inv = await prisma.invoice.findUnique({
                where: { id: finalInvoiceId },
                select: { shareToken: true, gym: { select: { slug: true } } }
            })
            if (inv?.shareToken) {
                const { getBaseUrl } = await import('@/lib/utils')
                publicInvoiceUrl = `${getBaseUrl()}/${inv.gym.slug}/invoice/${inv.shareToken}`
            }
        }

        // @ts-ignore
        const templateOverride = context.gym?.waWelcomeMsg || undefined;
        const welcomeMessage = templates.welcomeMessage(validatedData.name, context.gym.name, publicInvoiceUrl, templateOverride)
        const whatsappUrl = getWhatsAppLink(validatedData.phone, welcomeMessage)

        return { success: true, id: finalMemberId, invoiceId: finalInvoiceId, whatsappUrl }
    } catch (error: any) {
        console.error('Error creating member:', error)
        if (error.code === 'P2002') {
            const target = error.meta?.target
            if (Array.isArray(target)) {
                if (target.includes('email')) {
                    return { error: 'Member with this email already exists.' }
                }
                if (target.includes('phone')) {
                    return { error: 'Member with this phone number already exists.' }
                }
            }
            return { error: 'Member with the same unique field already exists.' }
        }
        return { error: 'Failed to create member.' }
    }
})

export const searchMembers = withAuth(async (_context, formData: FormData) => {
    const query = formData.get('q') as string
    const params = new URLSearchParams()

    if (query && query.trim()) {
        params.set('q', query.trim())
    }

    const slug = _context.gym.slug
    redirect(`/${slug}/members?${params.toString()}`)
})

export const filterByStatus = withAuth(async (_context, status: string) => {
    const params = new URLSearchParams()

    if (status && status !== 'ALL') {
        params.set('status', status)
    }

    const slug = _context.gym.slug
    redirect(`/${slug}/members?${params.toString()}`)
})

/**
 * Normalize phone: strip +91, leading 0, spaces, dashes, parens → 10-digit string.
 * Returns null if the result isn't a valid 10-digit number.
 */
function normalizePhone(raw: string): string | null {
    // Remove all non-digit characters
    let digits = raw.replace(/[^\d]/g, '')
    // Strip country code: 91XXXXXXXXXX → XXXXXXXXXX
    if (digits.length === 12 && digits.startsWith('91')) {
        digits = digits.slice(2)
    }
    // Strip leading 0: 0XXXXXXXXXX → XXXXXXXXXX
    if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1)
    }
    // Must be exactly 10 digits
    return digits.length === 10 ? digits : null
}

export const importMembers = withAuth(async (context, data: any[]) => {
    const gymId = context.gym.id
    const slug = context.gym.slug
    let imported = 0
    let skippedDuplicate = 0
    let skippedPlanNotFound = 0
    let skippedInvalidData = 0
    const failedRows: { row: any; reason: string }[] = []

    try {
        // 1. Get existing phones to skip duplicates (normalized)
        const existingMembers = await prisma.member.findMany({
            where: { gymId },
            select: { phone: true }
        })
        const existingPhones = new Set(existingMembers.map(m => m.phone))

        // 2. Get existing plans to map by name (case-insensitive)
        const existingPlans = await prisma.membershipPlan.findMany({
            where: { gymId, isActive: true }
        })
        const planMap = new Map(existingPlans.map(p => [p.name.trim().toLowerCase(), p]))

        // 3. Process rows INDIVIDUALLY — no single $transaction to avoid timeout
        for (let i = 0; i < data.length; i++) {
            const row = data[i]
            const rawPhone = String(row.phone || "").trim()
            const name = String(row.name || "").trim()

            // Validate name
            if (!name) {
                skippedInvalidData++
                failedRows.push({ row, reason: 'Missing name' })
                continue
            }

            // Normalize & validate phone
            const phone = normalizePhone(rawPhone)
            if (!phone) {
                skippedInvalidData++
                failedRows.push({ row, reason: `Invalid phone: "${rawPhone}" (must be 10 digits)` })
                continue
            }

            // Duplicate check (against DB + already-imported in this batch)
            if (existingPhones.has(phone)) {
                skippedDuplicate++
                failedRows.push({ row, reason: `Duplicate phone: ${phone}` })
                continue
            }

            // Plan matching
            const planName = String(row.planname || "").trim().toLowerCase()
            const plan = planName ? planMap.get(planName) : undefined

            if (planName && !plan) {
                skippedPlanNotFound++
                failedRows.push({ row, reason: `Plan not found: "${row.planname}"` })
                continue
            }

            // Per-row try/catch — one bad row doesn't kill the entire import
            try {
                const member = await prisma.member.create({
                    data: {
                        name,
                        phone,
                        email: row.email ? String(row.email).trim() : null,
                        dateOfBirth: row.dob ? new Date(row.dob) : new Date(1990, 0, 1),
                        joiningDate: row.joindate ? new Date(row.joindate) : new Date(),
                        gymId,
                        status: 'ACTIVE',
                        city: row.city ? String(row.city).trim() : undefined,
                        emergencyName: '',
                        emergencyPhone: '',
                        emergencyRelation: '',
                    }
                })

                // Create Subscription if plan exists
                if (plan) {
                    const startDate = row.joindate ? new Date(row.joindate) : new Date()
                    const expiryDate = row.expirydate ? new Date(row.expirydate) : null

                    if (expiryDate && isValid(new Date(expiryDate))) {
                        await prisma.memberSubscription.create({
                            data: {
                                memberId: member.id,
                                planId: plan.id,
                                gymId,
                                startDate: new Date(startDate),
                                endDate: new Date(expiryDate),
                                price: plan.price,
                                status: 'ACTIVE',
                                paymentStatus: 'PAID'
                            }
                        })
                    }
                }

                imported++
                existingPhones.add(phone)
            } catch (rowError: any) {
                skippedInvalidData++
                failedRows.push({ row, reason: `DB error: ${rowError?.message || 'Unknown error'}` })
            }
        }

        // Audit Log
        const headerList = await headers()
        const ipHeader = headerList.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

        await recordAuditLog({
            gymId,
            actorId: context.userId,
            action: 'IMPORT_MEMBERS',
            entityType: 'MEMBER',
            entityId: 'batch',
            ipAddress: ip,
            payload: { imported, skippedDuplicate, skippedPlanNotFound, skippedInvalidData, totalRows: data.length }
        }).catch(err => console.error('recordAuditLog IMPORT_MEMBERS', err))

        revalidatePath(`/${slug}/members`)
        revalidatePath(`/${slug}/dashboard`)

        return { imported, skippedDuplicate, skippedPlanNotFound, skippedInvalidData, failedRows }
    } catch (error: any) {
        console.error('Import error:', error)
        return { error: 'Failed to import members: ' + (error?.message || 'Unknown error'), imported, skippedDuplicate, skippedPlanNotFound, skippedInvalidData, failedRows }
    }
})
