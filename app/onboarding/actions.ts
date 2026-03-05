'use server'

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { Resend } from 'resend'
import { revalidatePath } from "next/cache"
import { headers, cookies } from "next/headers"
import { recordAuditLog } from "@/lib/audit-logger"
import { z } from "zod"
import { randomBytes } from 'crypto'
import * as React from 'react'
import { OnboardingEmail } from '@/components/emails/OnboardingEmail'
import { render } from '@react-email/render'
import type { GymProfile } from '@prisma/client'
import { Prisma } from '@prisma/client'

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

function toSlug(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function randomSuffix(): string {
    return randomBytes(3).toString('hex') // 6-char hex, e.g. "a3f1b2"
}

/**
 * Generate a slug from the business name.
 * - If `currentSlug` already matches the base, preserve it (avoids changing URLs on update).
 * - Otherwise, return the base slug (caller handles conflict via retry).
 */
function generateSlug(businessName: string, currentSlug?: string | null): string {
    const baseSlug = toSlug(businessName) || 'gym';
    // If the profile already has a slug that starts with the desired base, keep it
    if (currentSlug && (currentSlug === baseSlug || currentSlug.startsWith(`${baseSlug}-`))) {
        return currentSlug;
    }
    return baseSlug;
}

/** Max retries for slug uniqueness conflicts */
const MAX_SLUG_RETRIES = 3

export async function completeOnboarding(formData: FormData): Promise<{ redirectTo?: string; warnings?: string[], error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: "Unauthorized" }
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

    let gymProfile: GymProfile | undefined;
    let redirectSlug: string | null = null;
    const warnings: string[] = [];
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

        // Look up existing profile to preserve slug on updates
        const existingProfile = await prisma.gymProfile.findUnique({
            where: { userId: user.id },
            select: { slug: true },
        });

        // Generate slug — preserves existing slug if business name base hasn't changed
        let slug = generateSlug(validatedData.businessName, existingProfile?.slug);

        // Retry-on-conflict loop to handle TOCTOU race on the unique slug constraint
        for (let attempt = 0; attempt <= MAX_SLUG_RETRIES; attempt++) {
            try {
                gymProfile = await prisma.gymProfile.upsert({
                    where: { userId: user.id },
                    update: {
                        ...updateData,
                        name: validatedData.businessName,
                        slug,
                        isVerified: true,
                        onboardingStep: ONBOARDING_COMPLETE_STEP,
                    },
                    create: {
                        userId: user.id,
                        ...updateData,
                        name: validatedData.businessName,
                        slug,
                        isVerified: true,
                        onboardingStep: ONBOARDING_COMPLETE_STEP,
                    }
                })
                break; // Success — exit retry loop
            } catch (upsertError) {
                const isSlugConflict =
                    upsertError instanceof Prisma.PrismaClientKnownRequestError &&
                    upsertError.code === 'P2002' &&
                    (upsertError.meta?.target as string[] | undefined)?.includes('slug');

                if (isSlugConflict && attempt < MAX_SLUG_RETRIES) {
                    // Append random suffix and retry
                    const baseSlug = toSlug(validatedData.businessName) || 'gym';
                    slug = `${baseSlug}-${randomSuffix()}`;
                    continue;
                }
                throw upsertError; // Not a slug conflict or out of retries
            }
        }

        // Defensive check — gymProfile must exist after upsert
        if (!gymProfile) {
            return { error: "Failed to create or update your gym profile. Please try again." }
        }

        const gymId = gymProfile.id;

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
                            gymId,
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
                warnings.push("Your membership plans could not be saved. You can add them later in Settings.")
            }
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error("Onboarding validation failed:", error.flatten())
            return { error: `Validation Error: ${error.issues[0].message}` }
        }
        console.error("Onboarding logic failed:", error)
        return { error: `Failed to save your profile: ${error instanceof Error ? error.message : String(error)}` }
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

        // Send Welcome Email — await so it finishes before redirect() kills the context
        try {
            const resendKey = process.env.RESEND_API_KEY
            if (!resendKey) {
                console.warn('[Onboarding] RESEND_API_KEY not configured — skipping welcome email')
                warnings.push('Welcome email skipped: email service is not configured.')
            } else if (!gymProfile.email) {
                console.warn('[Onboarding] No gym email — skipping welcome email')
            } else {
                const resend = new Resend(resendKey)
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://gym.emitra.dev'

                const emailHtml = await render(React.createElement(OnboardingEmail, {
                    ownerName: user.user_metadata?.full_name || user.email?.split('@')[0] || gymProfile.businessName || gymProfile.name,
                    gymName: gymProfile.businessName || gymProfile.name,
                    loginUrl: `${baseUrl}/${gymProfile.slug}/dashboard`,
                    serviceAgreementUrl: `${baseUrl}/legal/service-agreement`,
                    saasPlan: 'FREE'
                }));

                const { error: emailError } = await resend.emails.send({
                    from: 'Gym Mitra Team <hello@mail.emitra.dev>',
                    to: gymProfile.email,
                    subject: `Welcome to Gym Mitra, ${gymProfile.businessName || gymProfile.name}! 🎉`,
                    html: emailHtml
                })

                if (emailError) {
                    console.error('[Onboarding] Resend API error:', emailError)
                    warnings.push(`Welcome email failed: ${emailError.message}`)
                } else {
                    console.log(`[Onboarding] Welcome email sent to ${gymProfile.email}`)
                }
            }
        } catch (emailError) {
            console.error('[Onboarding] Failed to send welcome email:', emailError)
            warnings.push(`Welcome email failed: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`)
        }

        redirectSlug = gymProfile.slug
    }

    // Return the redirect path — client will navigate via router.push()
    // This avoids NEXT_REDIRECT errors and ensures email send completes
    return {
        redirectTo: redirectSlug ? `/${redirectSlug}/dashboard` : '/dashboard',
        ...(warnings.length > 0 && { warnings }),
    }
}
