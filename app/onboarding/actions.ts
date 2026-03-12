'use server'

import { getBaseUrl } from '@/lib/utils'
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
import cryptoLib from 'crypto'

const onboardingSchema = z.object({
    businessName: z.string().min(2, "Business name is required"),
    ownerName: z.string().min(2, "Owner name is required"),
    address: z.string().min(5, "Address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().regex(/^\d{6}$/, "Pincode must be exactly 6 digits"),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    email: z.string().email("Valid email is required"),
    upiId: z.string().min(3, "UPI ID is required"),
    invoicePrefix: z.string().min(2, "Prefix is required").max(5, "Max 5 characters"),
    plans: z.string().optional(),
    termsAndConditions: z.string().optional(),
    gymRules: z.string().optional(),
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

const MAX_SLUG_RETRIES = 3

async function uploadToCloudinary(file: File): Promise<string> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        throw new Error("Cloudinary configuration is missing");
    }

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "gym_logos";

    // Create signature
    const signatureData = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = cryptoLib.createHash('sha1').update(signatureData).digest('hex');

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to upload image to Cloudinary");
    }

    const result = await response.json();
    return result.secure_url;
}

export async function completeOnboarding(formData: FormData): Promise<{ redirectTo?: string; warnings?: string[], error?: string }> {
    const auth = await import('@/lib/auth').then(mod => mod.getAuthGym())

    if (!auth || !auth.userId) {
        return { error: "Unauthorized" }
    }

    // We will use authId where user.id was used before
    const userId = auth.userId

    const rawData = {
        businessName: formData.get("businessName"),
        ownerName: formData.get("ownerName"),
        address: formData.get("address"),
        city: formData.get("city"),
        state: formData.get("state"),
        pincode: formData.get("pincode"),
        phone: formData.get("phone"),
        email: formData.get("email"),
        upiId: formData.get("upiId"),
        invoicePrefix: formData.get("invoicePrefix")?.toString().toUpperCase(),
        plans: formData.get("plans"),
        termsAndConditions: formData.get("termsAndConditions"),
        gymRules: formData.get("gymRules"),
    }

    let gymProfile: GymProfile | undefined;
    let redirectSlug: string | null = null;
    const warnings: string[] = [];
    try {
        const validatedData = onboardingSchema.parse(rawData)
        const updateData = {
            businessName: validatedData.businessName,
            ownerName: validatedData.ownerName,
            address: validatedData.address,
            city: validatedData.city,
            state: validatedData.state,
            pincode: validatedData.pincode,
            phone: validatedData.phone,
            email: validatedData.email,
            upiId: validatedData.upiId,
            invoicePrefix: validatedData.invoicePrefix,
            termsAndConditions: validatedData.termsAndConditions,
            gymRules: validatedData.gymRules,
            logoUrl: null as string | null,
        }

        // Handle Logo Upload if present
        const logoFile = formData.get("logo") as File | null;
        if (logoFile && logoFile.size > 0) {
            try {
                updateData.logoUrl = await uploadToCloudinary(logoFile);
            } catch (uploadError) {
                console.error("Cloudinary upload failed:", uploadError);
                warnings.push("Logo upload failed. Your profile was saved without a logo.");
            }
        }

        // Look up existing profile to preserve slug on updates
        const existingProfile = await prisma.gymProfile.findUnique({
            where: { userId: userId },
            select: { slug: true },
        });

        // Generate slug — preserves existing slug if business name base hasn't changed
        let slug = generateSlug(validatedData.businessName, existingProfile?.slug);

        // Retry-on-conflict loop to handle TOCTOU race on the unique slug constraint
        for (let attempt = 0; attempt <= MAX_SLUG_RETRIES; attempt++) {
            try {
                gymProfile = await prisma.gymProfile.upsert({
                    where: { userId: userId },
                    update: {
                        ...updateData,
                        name: validatedData.businessName,
                        slug,
                        isVerified: true,
                        onboardingStep: ONBOARDING_COMPLETE_STEP,
                    },
                    create: {
                        userId: userId,
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
        return { error: "An unexpected error occurred while saving your profile" }
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
            actorId: userId,
            action: 'ONBOARDING_COMPLETE',
            entityType: 'GYM',
            entityId: gymProfile.id,
            ipAddress: ip,
            payload: { businessName: gymProfile.name }
        })

        // Trigger Gym Activation Webhook (sends Welcome Email + QR Poster PDF)
        try {
            const baseUrl = getBaseUrl()
            fetch(`${baseUrl}/api/webhooks/gym-activated`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-secret': process.env.CRON_SECRET || ''
                },
                body: JSON.stringify({ gymId: gymProfile.id })
            }).catch(e => console.error('[Onboarding] Async webhook failure:', e))
        } catch (webhookError) {
            console.error('[Onboarding] Failed to trigger welcome webhook:', webhookError)
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
