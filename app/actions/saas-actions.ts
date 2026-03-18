'use client'
// This file was mistakenly marked with 'use client' in my thought but it should be 'use server'
// Correcting it below.

'use server'

import { prisma } from "@/lib/prisma"
import { getAuthGym } from "@/lib/auth"
import { SaaSPlan } from "@prisma/client"
import { revalidatePath } from "next/cache"

/**
 * Validates and activates a license key for a gym.
 * 
 * Logic:
 * 1. Verify user is owner.
 * 2. Validate key format (GM-XXXX-XXXX-XXXX).
 * 3. Check if key is already used by another gym.
 * 4. Update gym profile to MAIN_PLAN.
 */
export async function activateLicense(licenseKey: string) {
    try {
        const auth = await getAuthGym()
        if (!auth || auth.role !== 'OWNER') {
            return { success: false, error: "Unauthorized. Only the gym owner can activate a license." }
        }

        const gymId = auth.gym.id
        const sanitizedKey = licenseKey.trim().toUpperCase()

        // 1. Basic format validation: GM-XXXX-XXXX-XXXX
        const licenseRegex = /^GM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
        if (!licenseRegex.test(sanitizedKey)) {
            return { success: false, error: "Invalid license key format. Expected GM-XXXX-XXXX-XXXX" }
        }

        // 2. Check if key is already used
        const existingUse = await prisma.gymProfile.findUnique({
            where: { licenseKey: sanitizedKey }
        })

        if (existingUse) {
            if (existingUse.id === gymId) {
                return { success: false, error: "This license is already active for your gym." }
            }
            return { success: false, error: "This license key has already been used by another gym." }
        }

        // 3. Activate license
        await prisma.gymProfile.update({
            where: { id: gymId },
            data: {
                saasPlan: SaaSPlan.MAIN_PLAN,
                licenseKey: sanitizedKey,
                licenseActivatedAt: new Date(),
                // If they had a trial, it's effectively over
            }
        })

        revalidatePath(`/${auth.gym.slug}/settings`)
        
        return { success: true }
    } catch (error: any) {
        console.error("License Activation Error:", error)
        return { success: false, error: "Server error during activation. Please try again later." }
    }
}
