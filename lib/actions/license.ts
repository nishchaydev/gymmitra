import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getAuthGym } from "@/lib/auth"

export async function activateLicense(licenseKey: string) {
    const auth = await getAuthGym()
    if (!auth) {
        throw new Error("Unauthorized")
    }

    const { gym } = auth
    
    // 1. Basic validation
    if (!licenseKey || licenseKey.trim().length < 8) {
        throw new Error("Invalid license key format")
    }

    const trimmedKey = licenseKey.trim()

    // 2. Perform atomic update using an interactive transaction to prevent race conditions
    await prisma.$transaction(async (tx) => {
        // Find existing code to check expiration before attempting atomic update
        const existingCode = await tx.registrationCode.findUnique({
            where: { code: trimmedKey }
        })

        if (!existingCode || !existingCode.isActive) {
            throw new Error("Invalid or inactive license key")
        }

        if (existingCode.expiresAt && new Date() > existingCode.expiresAt) {
            throw new Error("License key has expired")
        }

        if (existingCode.plan !== 'MAIN_PLAN') {
            throw new Error("This license key is not valid for the MAIN_PLAN")
        }

        // Atomically increment if under the limit
        const result = await tx.registrationCode.updateMany({
            where: { 
                id: existingCode.id,
                usedCount: { lt: existingCode.maxUses },
                isActive: true
            },
            data: {
                usedCount: { increment: 1 }
            }
        })

        if (result.count === 0) {
            throw new Error("License key has already been used to its maximum capacity")
        }

        // 3. Update GymProfile 
        await tx.gymProfile.update({
            where: { id: gym.id },
            data: {
                saasPlan: 'MAIN_PLAN',
                licenseKey: trimmedKey,
                licenseActivatedAt: new Date(),
            }
        })
    }, { timeout: 15000, maxWait: 10000 })

    revalidatePath(`/${gym.slug}/settings/billing`)
    revalidatePath(`/${gym.slug}/dashboard`)
    
    return { success: true }
}
