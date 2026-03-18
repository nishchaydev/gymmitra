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
import { activateLicense as coreActivateLicense } from "@/lib/actions/license"

/**
 * Server action wrapper for license activation.
 * Calls the core logic and handles errors for the UI.
 */
export async function activateLicense(licenseKey: string): Promise<{ success: boolean, error?: string }> {
    try {
        await coreActivateLicense(licenseKey)
        return { success: true }
    } catch (error: any) {
        // Sanitize for the client
        const errorMessage = error instanceof Error ? error.message : "Activation failed"
        console.error("[LICENSE_ACTIVATE_ERROR]", errorMessage)
        
        return { 
            success: false, 
            error: errorMessage.includes("Unauthorized") 
                ? "Unauthorized session" 
                : "Server error during activation. Please check your key or try again."
        }
    }
}
