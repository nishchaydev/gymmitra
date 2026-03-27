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
import { safeParseDate, isLeapYear, validateDateRange } from '@/lib/utils'
import { format, parseISO, isValid, addMonths } from 'date-fns'
import { Prisma, PaymentStatus, SubscriptionStatus } from '@prisma/client'
import { generateInvoiceNumber } from '@/lib/invoice-server-utils'
import { after } from 'next/server'

const memberSchema = z.object({
     name: z.string().min(2, "Name must be at least 2 characters"),
     phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
     email: z.string().email().optional().or(z.literal('')),
      dateOfBirth: z.union([z.string(), z.null()]).optional().nullable()
          .transform(str => str && str !== '' && !isNaN(Date.parse(str)) ? new Date(str) : null),
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
     customEndDate: z.union([z.string(), z.null()]).optional().nullable()
         .transform(str => str && str !== '' && !isNaN(Date.parse(str)) ? new Date(str) : null),
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
             const memberData: any = {
                 name: formattedName,
                 phone: validatedData.phone,
                 gymId,
                 status: 'ACTIVE',
                 memberState: 'ACTIVE',
             };

             if (validatedData.email) memberData.email = validatedData.email;
             if (validatedData.dateOfBirth) memberData.dateOfBirth = validatedData.dateOfBirth;
             if (validatedData.pincode) memberData.pincode = validatedData.pincode;
             if (validatedData.state) memberData.state = validatedData.state;
             if (validatedData.city) memberData.city = validatedData.city;
             if (validatedData.emergencyName) memberData.emergencyName = validatedData.emergencyName;
             if (validatedData.emergencyPhone) memberData.emergencyPhone = validatedData.emergencyPhone;
             if (validatedData.emergencyRelation) memberData.emergencyRelation = validatedData.emergencyRelation;

             const member = await tx.member.create({
                 data: memberData
             })
            finalMemberId = member.id

            // 2. If a Plan is Selected, Create Subscription and Invoice
            if (validatedData.planId && validatedData.planId !== 'none') {
                const plan = await tx.membershipPlan.findUnique({
                    where: { id: validatedData.planId }
                })

                if (!plan) throw new Error("Selected plan not found")

                const startDate = new Date()
                const endDate = validatedData.customEndDate
                    ? validatedData.customEndDate
                    : addMonths(startDate, plan.duration)
                const paymentMethod = (validatedData.paymentMethod || 'CASH') as PaymentStatus

                const planPrice = (validatedData.customPrice !== undefined && validatedData.customPrice > 0) ? validatedData.customPrice : Number(plan.price)
                const discount = validatedData.discount || 0
                const total = Math.max(0, planPrice - discount)
                const amountPaid = validatedData.amountPaid ?? total
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
        const planMap = new Map<string, any>(existingPlans.map(p => [p.name.trim().toLowerCase(), p]))

        // 2b. Auto-create missing plans (Pre-pass)
        const uniquePlanNames = new Set<string>()
        for (const row of data) {
            const rowPlanName = String(row.planname || "").trim()
            if (rowPlanName) {
                uniquePlanNames.add(rowPlanName)
            }
        }

        for (const originalPlanName of uniquePlanNames) {
            const lowerPlanName = originalPlanName.toLowerCase()
            if (!planMap.has(lowerPlanName)) {
                try {
                    const newPlan = await prisma.membershipPlan.create({
                        data: {
                            name: originalPlanName,
                            duration: 1,  // Default to 1 month
                            price: 0,    // Default to 0 price — owner should update in Plans
                            features: [],
                            isActive: true,
                            gymId,
                        }
                    })
                    planMap.set(lowerPlanName, newPlan)
                } catch (createErr) {
                    console.error(`Failed to auto-create plan: ${originalPlanName}`, createErr)
                }
            }
        }

        // 3. Process rows in memory to prepare insert batches
        const newMembers: any[] = []
        const newSubscriptions: any[] = []

        for (const row of data) {
            const rawPhone = String(row.phone || "").trim()
            let name = String(row.name || "").trim()

            // Validate name
            if (!name) {
                skippedInvalidData++
                failedRows.push({ row, reason: 'Missing name' })
                continue
            }
            name = name.substring(0, 190) // Prevent "value too long" errors

            // Normalize & validate phone
            const phone = normalizePhone(rawPhone)
            if (!phone) {
                skippedInvalidData++
                failedRows.push({ row, reason: `Invalid phone: "${rawPhone}" (must be 10 digits)` })
                continue
            }

            // Duplicate check (against DB + already-imported)
            if (existingPhones.has(phone)) {
                skippedDuplicate++
                failedRows.push({ row, reason: `Duplicate phone: ${phone}` })
                continue
            }
            // Add to existing phones immediately to prevent in-batch duplicates
            existingPhones.add(phone)

            // Plan matching
            const planName = String(row.planname || "").trim().toLowerCase()
            const plan = planName ? planMap.get(planName) : undefined

            if (planName && !plan) {
                skippedPlanNotFound++
                failedRows.push({ row, reason: `Plan not found: "${row.planname}"` })
                existingPhones.delete(phone) // remove if failed
                continue
            }

             // Prepare Member record
             const email = row.email ? String(row.email).trim().substring(0, 190) : null
             const city = row.city ? String(row.city).trim().substring(0, 190) : undefined
             
             // Import validation checks — using enterprise-grade date safety
             const joinDate = safeParseDate(row.joindate) || new Date();
             let importErrors: string[] = [];
             
             // Check 1: expiry before joindate using validateDateRange
             if (row.expirydate) {
                 const expiryDate = safeParseDate(row.expirydate);
                 if (!expiryDate) {
                     importErrors.push(`Invalid expiry date format`);
                 } else if (expiryDate < joinDate) {
                     importErrors.push(`Expiry date is before join date`);
                 }
             }
             
             // Check 2: DOB validation — leap year safe via safeParseDate
             if (row.dob) {
                 const dobParsed = safeParseDate(row.dob);
                 if (!dobParsed) {
                     // DOB is invalid but don't block import — just warn
                     console.warn(`[Import] Row "${name}" has invalid DOB: ${row.dob}`);
                 }
             } else {
                 console.warn(`[Import] Row "${name}" has no DOB — birthday reminders won't work`);
             }
             
             // Only hard errors cause row rejection
             if (importErrors.length > 0) {
                 skippedInvalidData++;
                 failedRows.push({ row, reason: importErrors.join('; ') });
                 continue;
             }
 
             // To ensure Subscriptions can be linked, pre-generate a UUID for the Member.
             // Prisma supports passing custom IDs for default cuid fields.
             const newMemberId = crypto.randomUUID()
 
             newMembers.push({
                 id: newMemberId,
                 name,
                 phone,
                 email,
                 dateOfBirth: row.dob ? new Date(row.dob) : undefined,
                 joiningDate: joinDate,
                 gymId,
                 status: 'ACTIVE',
                 memberState: 'ACTIVE',
                 pauseReturnDate: null,
                 city,
                 emergencyName: '',
                 emergencyPhone: '',
                 emergencyRelation: '',
             })
 
             // Prepare Subscription if plan exists
             if (plan) {
                 const startDate = joinDate;
                 const expiryDate = row.expirydate ? new Date(row.expirydate) : null;
 
                 if (expiryDate && isValid(new Date(expiryDate))) {
                     newSubscriptions.push({
                         id: crypto.randomUUID(),
                         memberId: newMemberId,
                         planId: plan.id,
                         gymId,
                         startDate: startDate,
                         endDate: expiryDate,
                         price: plan.price,
                         status: 'ACTIVE',
                         paymentStatus: 'PAID'
                     })
                 }
             }

            imported++
        }

        // 4. Perform bulk inserts using createMany
        if (newMembers.length > 0) {
            try {
                await prisma.member.createMany({
                    data: newMembers,
                    skipDuplicates: true
                })
            } catch (err: any) {
                console.error("Bulk insert failed for Members:", err)
                throw new Error("Bulk insert failed for Members: " + (err?.message || "Unknown error"))
            }

            if (newSubscriptions.length > 0) {
                try {
                    await prisma.memberSubscription.createMany({
                        data: newSubscriptions,
                        skipDuplicates: true
                    })
                } catch (err: any) {
                    console.error("Bulk insert failed for Subscriptions:", err)
                    throw new Error("Bulk insert failed for Subscriptions: " + (err?.message || "Unknown error"))
                }
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
