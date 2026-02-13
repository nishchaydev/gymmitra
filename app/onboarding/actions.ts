'use server'

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const onboardingSchema = z.object({
    businessName: z.string().min(2, "Business name is required"),
    address: z.string().min(5, "Address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().min(6, "Valid 6-digit pincode is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    email: z.string().email("Valid email is required"),
    upiId: z.string().min(3, "UPI ID is required"),
    invoicePrefix: z.string().min(2, "Prefix is required").max(5, "Max 5 characters"),
})

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
                onboardingStep: 4,
            },
            create: {
                userId: user.id,
                ...validatedData,
                name: validatedData.businessName,
                isVerified: true,
                onboardingStep: 4,
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

    redirect("/dashboard")
}
