import { memberSchema } from './validator'
import { MemberRepository } from './repository'
import { BillingRepository } from '@/src/modules/billing/repository'
import { recordAuditLog } from '@/lib/audit-logger'
import { safeParseDate } from '@/lib/utils'
import { isValid } from 'date-fns'
import { PLAN_MEMBER_LIMITS, type SaaSPlan } from '@/lib/with-plan'

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
import crypto from 'crypto'
import { Resend } from 'resend'
import { WelcomeEmail } from '@/components/emails/WelcomeEmail'
import React from 'react'
import { format, addMonths } from 'date-fns'
import { PaymentStatus, SubscriptionStatus, PaymentMethod } from '@prisma/client'
import { templates, getWhatsAppLink } from '@/lib/whatsapp'
import { getBaseUrl } from '@/lib/utils'
import { z } from 'zod'

export class MemberService {
    static async createMember(
        gymId: string,
        gymSettings: { name: string, logo?: string | null, logoUrl?: string | null, address: string, phone: string, invoiceLinkExpiryDays?: number, termsAndConditions?: string | null, gymRules?: string | null, waWelcomeMsg?: string | null, saasPlan?: string },
        userId: string,
        ip: string,
        validatedData: z.infer<typeof memberSchema>
    ) {
        // ── Member Cap Enforcement (plan/limit resolved outside tx for efficiency) ──
        const plan = (gymSettings.saasPlan ?? 'TRIAL') as SaaSPlan
        const limit = PLAN_MEMBER_LIMITS[plan]
        // ──────────────────────────────────────────────────────────────────

        const existingMember = await MemberRepository.findByPhone(validatedData.phone, gymId)
        if (existingMember) return { error: 'Member with this phone number already exists in your gym.' }

        let finalMemberId: string = ""
        let finalInvoiceId: string | undefined = undefined

        await MemberRepository.executeTransaction(async (tx) => {
            // ── TOCTOU-safe member cap: count inside the transaction ──────────
            // Use `tx` (not the raw prisma client) so the count participates in the
            // SERIALIZABLE transaction and is correctly isolated from concurrent writes.
            if (limit !== null) {
                const currentCount = await tx.member.count({
                    where: { gymId, deletedAt: null }
                })
                if (currentCount >= limit) {
                    throw new Error(`MEMBER_CAP:${limit}:${plan}`)
                }
            }
            // ─────────────────────────────────────────────────────────────────

            // Capitalize first letter of every word
            const formattedName = validatedData.name
                .split(' ')
                .map(word =>
                    word.replace(/([^-']+)/g, (segment) =>
                        segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
                    )
                )
                .join(' ')

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
            memberData.emergencyName = validatedData.emergencyName || "";
            memberData.emergencyPhone = validatedData.emergencyPhone || "";
            memberData.emergencyRelation = validatedData.emergencyRelation || "";

            const member = await MemberRepository.createMember(memberData, tx)
            finalMemberId = member.id

            // If a Plan is Selected, Create Subscription and Invoice
            if (validatedData.planId && validatedData.planId !== 'none') {
                const plan = await MemberRepository.findPlanById(validatedData.planId, tx)
                if (!plan) throw new Error("Selected plan not found")

                // Stack: start from current end date if active sub exists, else today
                const currentSub = await MemberRepository.findLatestActiveSubscription(member.id, tx)
                const startDate = currentSub?.endDate && currentSub.endDate > new Date()
                    ? currentSub.endDate
                    : new Date()
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

                const subscription = await MemberRepository.createSubscription({
                    memberId: member.id,
                    planId: plan.id,
                    gymId,
                    startDate,
                    endDate,
                    price: planPrice,
                    status: 'ACTIVE' as SubscriptionStatus,
                    paymentStatus: paymentStatus
                }, tx)

                // Generate Invoice — via BillingRepository (no direct tx.invoice calls)
                const invoiceNumber = await BillingRepository.generateInvoiceNumber(gymId, tx)
                const shareToken = crypto.randomBytes(32).toString('hex')
                const expiryDays = gymSettings.invoiceLinkExpiryDays ?? 30
                const shareTokenExpiresAt = expiryDays > 0
                    ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
                    : null

                const invoice = await BillingRepository.createInvoiceInTransaction({
                    invoiceNumber,
                    type: 'MEMBERSHIP',
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
                    paymentMethod: paymentMethod as PaymentMethod,
                    shareToken,
                    shareTokenExpiresAt,
                    issueDate: new Date(),
                    dueDate: new Date(),
                    items: [{
                        description: `${plan.name} Membership (${plan.duration} Months)`,
                        amount: planPrice,
                        quantity: 1,
                        unitPrice: planPrice,
                        gymId: gymId,
                    }]
                }, tx)

                finalInvoiceId = invoice.id
            }
        })

        // Audit Log
        await recordAuditLog({
            gymId,
            actorId: userId,
            action: 'CREATE_MEMBER',
            entityType: 'MEMBER',
            entityId: finalMemberId,
            ipAddress: ip,
            payload: { name: validatedData.name, planId: validatedData.planId }
        }).catch(err => console.error('recordAuditLog CREATE_MEMBER', err))

        let publicInvoiceUrl: string | undefined = undefined

        if (finalInvoiceId) {
            // Use BillingRepository instead of direct tx.invoice call
            const invWithToken = await BillingRepository.findInvoiceWithToken(finalInvoiceId)

            if (invWithToken?.shareToken) {
                publicInvoiceUrl = `${getBaseUrl()}/${invWithToken.gym.slug}/invoice/${invWithToken.shareToken}`
            }
        }

        const templateOverride = gymSettings.waWelcomeMsg || undefined;
        const welcomeMessage = templates.welcomeMessage(validatedData.name, gymSettings.name, publicInvoiceUrl, templateOverride)
        const whatsappUrl = getWhatsAppLink(validatedData.phone, welcomeMessage)

        return { success: true, id: finalMemberId, invoiceId: finalInvoiceId, whatsappUrl, email: validatedData.email }
    }

    /**
     * Non-blocking background task to actually send the email.
     */
    static async sendWelcomeEmailAsync(
        gymSettings: any,
        memberId: string,
        gymId: string,
        email: string,
        name: string,
        invoiceId?: string
    ) {
        if (!email || email.length === 0) return

        try {
            const resendKey = process.env.RESEND_API_KEY
            if (!resendKey) {
                console.error('[WelcomeEmail] RESEND_API_KEY not set')
                return
            }

            const resend = new Resend(resendKey)
            
            const latestSub = await MemberRepository.findLatestActiveSubscription(memberId)

            let publicInvoiceUrl: string | undefined = undefined
            if (invoiceId) {
                // Use BillingRepository instead of direct tx.invoice call
                const invWithToken = await BillingRepository.findInvoiceWithToken(invoiceId)
                if (invWithToken?.shareToken) {
                    publicInvoiceUrl = `${getBaseUrl()}/${invWithToken.gym.slug}/invoice/${invWithToken.shareToken}`
                }
            }

            const { error } = await resend.emails.send({
                from: `${gymSettings.name} <hello@mail.emitra.dev>`,
                to: email,
                subject: `Welcome to ${gymSettings.name}, ${name}!`,
                react: React.createElement(WelcomeEmail, {
                    gymName: gymSettings.name,
                    gymLogo: gymSettings.logoUrl || gymSettings.logo,
                    memberName: name,
                    planName: latestSub?.plan?.name || 'Pay-as-you-go',
                    expiryDate: latestSub?.endDate ? format(latestSub.endDate, 'PPP') : 'Contact Gym',
                    gymAddress: gymSettings.address,
                    gymContact: gymSettings.phone,
                    invoiceUrl: publicInvoiceUrl,
                    termsAndConditions: gymSettings.termsAndConditions,
                    gymRules: gymSettings.gymRules
                }) as React.ReactElement
            })

            if (error) console.error('[WelcomeEmail] Resend error:', JSON.stringify(error))
            else console.log('[WelcomeEmail] Sent successfully to', email)
        } catch (err) {
            console.error('[WelcomeEmail] Logic error:', err)
        }
    }

    static async updateMember(
        memberId: string,
        gymId: string,
        userId: string,
        ip: string,
        validatedData: ReturnType<typeof import('./validator').memberUpdateSchema.parse>
    ) {
        if (validatedData.name) {
            validatedData.name = validatedData.name
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ')
        }

        const count = await MemberRepository.countById(memberId, gymId)
        if (count === 0) return { error: 'Member not found', status: 404 }

        await MemberRepository.updateMember(memberId, gymId, validatedData)

        // Audit Log
        await recordAuditLog({
            gymId,
            actorId: userId,
            action: 'UPDATE_MEMBER',
            entityType: 'MEMBER',
            entityId: memberId,
            ipAddress: ip,
            payload: { changedFields: Object.keys(validatedData) }
        }).catch(err => console.error('recordAuditLog UPDATE_MEMBER', err))

        return { success: true }
    }

    static async importMembers(data: any[], gymId: string, userId: string, ip: string) {
        const MAX_IMPORT_ROWS = 500
        if (data.length > MAX_IMPORT_ROWS) {
            return { error: `Import limit exceeded: maximum ${MAX_IMPORT_ROWS} rows allowed per import. You sent ${data.length}.` }
        }

        let imported = 0
        let skippedDuplicate = 0
        let skippedPlanNotFound = 0
        let skippedInvalidData = 0
        const failedRows: { row: any; reason: string }[] = []

        try {
            // 1. Get existing phones to skip duplicates (normalized)
            const existingPhonesArray = await MemberRepository.fetchAllPhones(gymId)
            const existingPhones = new Set(existingPhonesArray)

            // 2. Get existing plans to map by name (case-insensitive)
            const existingPlans = await MemberRepository.findActivePlans(gymId)
            const planMap = new Map<string, any>(existingPlans.map(p => [p.name.trim().toLowerCase(), p]))

            // 2b. Auto-create missing plans (Pre-pass)
            const uniquePlanNames = new Set<string>()
            for (const row of data) {
                const rowPlanName = String(row.planname || "").trim()
                if (rowPlanName) {
                    uniquePlanNames.add(rowPlanName)
                }
            }

            const autoCreatedPlans: string[] = []

            for (const originalPlanName of uniquePlanNames) {
                const lowerPlanName = originalPlanName.toLowerCase()
                if (!planMap.has(lowerPlanName)) {
                    try {
                        const newPlan = await MemberRepository.createPlan({
                            name: originalPlanName,
                            duration: 1,  // Default to 1 month
                            price: 0,    // Default to 0 price — owner should update in Plans
                            features: [],
                            isActive: true,
                            gymId,
                        })
                        planMap.set(lowerPlanName, newPlan)
                        autoCreatedPlans.push(originalPlanName)
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
                 
                 // Check 2: DOB validation
                 if (row.dob) {
                     const dobParsed = safeParseDate(row.dob);
                     if (!dobParsed) {
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
                    await MemberRepository.bulkCreateMembers(newMembers)
                } catch (err: any) {
                    console.error("Bulk insert failed for Members:", err)
                    throw new Error("Bulk insert failed for Members: " + (err?.message || "Unknown error"))
                }

                if (newSubscriptions.length > 0) {
                    try {
                        await MemberRepository.bulkCreateSubscriptions(newSubscriptions)
                    } catch (err: any) {
                        console.error("Bulk insert failed for Subscriptions:", err)
                        throw new Error("Bulk insert failed for Subscriptions: " + (err?.message || "Unknown error"))
                    }
                }
            }

            // Audit Log
            await recordAuditLog({
                gymId,
                actorId: userId,
                action: 'IMPORT_MEMBERS',
                entityType: 'MEMBER',
                entityId: 'batch',
                ipAddress: ip,
                payload: { imported, skippedDuplicate, skippedPlanNotFound, skippedInvalidData, totalRows: data.length }
            }).catch(err => console.error('recordAuditLog IMPORT_MEMBERS', err))

            return {
                imported,
                skippedDuplicate,
                skippedPlanNotFound,
                skippedInvalidData,
                failedRows,
                autoCreatedPlans,
                warning: autoCreatedPlans.length > 0
                    ? `Plans auto-created with ₹0 price: ${autoCreatedPlans.join(', ')} — please update prices in Plans settings.`
                    : undefined
            }
        } catch (error: any) {
            console.error('Import error:', error)
            return { error: 'Failed to import members: ' + (error?.message || 'Unknown error'), imported, skippedDuplicate, skippedPlanNotFound, skippedInvalidData, failedRows }
        }
    }
}
