'use server'

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { Resend } from 'resend'
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { headers, cookies } from "next/headers"
import { recordAuditLog } from "@/lib/audit-logger"
import { z } from "zod"
import * as React from 'react'
import { OnboardingEmail } from '@/components/emails/OnboardingEmail'

const onboardingSchema = z.object({
    businessName: z.string().min(2, "Business name is required"),
    address: z.string().min(5, "Address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    email: z.string().email("Valid email is required"),
    upiId: z.string().min(3, "UPI ID is required"),
    invoicePrefix: z.string().min(2, "Prefix is required").max(5, "Max 5 characters"),
    plans: z.string().optional(),
})

const ONBOARDING_COMPLETE_STEP = 4

export async function completeOnboarding(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    const rawData = {
        businessName: formData.get("businessName"),
        address: formData.get("address"),
        city: formData.get("city"),
        state: formData.get("state"),
        pincode: formData.get("pincode"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        upiId: formData.get("upiId"),
        invoicePrefix: formData.get("invoicePrefix")?.toString().toUpperCase(),
        plans: formData.get("plans"),
    }

    let gymProfile: any;
    try {
        const validatedData = onboardingSchema.parse(rawData)
        const updateData = {
            businessName: validatedData.businessName,
            address: validatedData.address,
            city: validatedData.city,
            state: validatedData.state,
            pincode: validatedData.pincode,
            phone: validatedData.phone,
            email: validatedData.email,
            upiId: validatedData.upiId,
            invoicePrefix: validatedData.invoicePrefix,
        }

        gymProfile = await prisma.gymProfile.upsert({
            where: { userId: user.id },
            update: {
                ...updateData,
                name: validatedData.businessName,
                isVerified: true,
                onboardingStep: ONBOARDING_COMPLETE_STEP,
            },
            create: {
                userId: user.id,
                ...updateData,
                name: validatedData.businessName,
                isVerified: true,
                onboardingStep: ONBOARDING_COMPLETE_STEP,
            }
        })

        // Process Plans
        if (validatedData.plans) {
            try {
                const planSchema = z.array(z.object({
                    name: z.string().min(1),
                    durationMonths: z.number().int().positive(),
                    price: z.number().nonnegative(),
                    enabled: z.boolean()
                }))

                const parsedPlans = JSON.parse(validatedData.plans)
                const validPlans = planSchema.parse(parsedPlans)
                const enabledPlans = validPlans.filter(p => p.enabled)

                if (enabledPlans.length > 0) {
                    await prisma.membershipPlan.createMany({
                        data: enabledPlans.map(p => ({
                            gymId: gymProfile.id,
                            name: p.name,
                            description: `${p.durationMonths} Month${p.durationMonths > 1 ? 's' : ''} Membership`,
                            duration: p.durationMonths,
                            price: p.price,
                            isActive: true
                        })),
                        skipDuplicates: true
                    })
                }
            } catch (planError) {
                console.error("Failed to parse or create onboarding plans:", planError)
                // We don't throw here to avoid failing entire onboarding over plan creation
            }
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("Onboarding validation failed:", error.flatten())
            throw new Error(`Validation Error: ${error.issues[0].message}`)
        }
        console.error("Onboarding logic failed:", error)
        throw new Error("Failed to save your profile. Please check all fields and try again.")
    }

    revalidatePath("/dashboard")
    revalidatePath("/members")
    revalidatePath("/invoices")

    // Set cookie for middleware optimization
    const cookieStore = await cookies()
    cookieStore.set('gym_onboarded', 'true', {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    })

    // Audit Log
    const headerList = await headers()
    const ip = headerList.get('x-forwarded-for') || '127.0.0.1'

    // We reuse the gymProfile we upserted
    if (gymProfile) {
        await recordAuditLog({
            gymId: gymProfile.id,
            actorId: user.id,
            action: 'ONBOARDING_COMPLETE',
            entityType: 'GYM',
            entityId: gymProfile.id,
            ipAddress: ip,
            payload: { businessName: gymProfile.name }
        })

        // Send Welcome Email asynchronously
        try {
            const resendKey = process.env.RESEND_API_KEY
            if (resendKey && gymProfile.email) {
                const resend = new Resend(resendKey)
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gym.emitra.dev'

                // Fire and forget so we don't block the redirect
                resend.emails.send({
                    from: 'Gym Mitra Team <hello@mail.emitra.dev>',
                    to: gymProfile.email,
                    subject: `Welcome to Gym Mitra, ${gymProfile.businessName}! 🎉`,
                    react: React.createElement(OnboardingEmail, {
                        ownerName: user.user_metadata?.full_name || user.email?.split('@')[0] || gymProfile.businessName,
                        gymName: gymProfile.businessName,
                        loginUrl: `${baseUrl}/${gymProfile.slug}/dashboard`,
                        serviceAgreementUrl: `${baseUrl}/legal/service-agreement`,
                        saasPlan: 'FREE' // Could be updated if onboarding includes plan tracking dynamically
                    })
                }).catch(emailError => {
                    console.error('[Onboarding] Failed to send welcome email promise:', emailError)
                })
            }
        } catch (emailError) {
            console.error('[Onboarding] Failed to initiate welcome email:', emailError)
        }
    }

    redirect(`/${gymProfile.slug}/dashboard`)
}
