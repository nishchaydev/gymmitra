'use server'

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { headers, cookies } from "next/headers"
import { recordAuditLog } from "@/lib/audit-logger"
import { z } from "zod"

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
    }

    try {
        const validatedData = onboardingSchema.parse(rawData)

        await prisma.gymProfile.upsert({
            where: { userId: user.id },
            update: {
                ...validatedData,
                name: validatedData.businessName,
                isVerified: true,
                onboardingStep: ONBOARDING_COMPLETE_STEP,
            },
            create: {
                userId: user.id,
                ...validatedData,
                name: validatedData.businessName,
                isVerified: true,
                onboardingStep: ONBOARDING_COMPLETE_STEP,
            }
        })
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

    // We fetch the gym profile again or assume it was updated/created
    const gym = await prisma.gymProfile.findUnique({
        where: { userId: user.id }
    })

    if (gym) {
        recordAuditLog({
            gymId: gym.id,
            actorId: user.id,
            action: 'ONBOARDING_COMPLETE',
            entityType: 'GYM',
            entityId: gym.id,
            ipAddress: ip,
            payload: { businessName: gym.name }
        })
    }

    redirect("/dashboard")
}
