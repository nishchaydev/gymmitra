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

    // 2. Verify license key in the RegistrationCode table
    const registrationCode = await prisma.registrationCode.findUnique({
        where: { code: licenseKey.trim() }
    })

    if (!registrationCode || !registrationCode.isActive) {
        throw new Error("Invalid or inactive license key")
    }

    if (registrationCode.expiresAt && new Date() > registrationCode.expiresAt) {
        throw new Error("License key has expired")
    }

    if (registrationCode.usedCount >= registrationCode.maxUses) {
        throw new Error("License key has already been used")
    }

    if (registrationCode.plan !== 'MAIN_PLAN') {
        throw new Error("This license key is not valid for the MAIN_PLAN")
    }

    // 3. Update GymProfile and RegistrationCode usage in a transaction
    await prisma.$transaction([
        prisma.gymProfile.update({
            where: { id: gym.id },
            data: {
                saasPlan: 'MAIN_PLAN',
                licenseKey: licenseKey.trim(),
                licenseActivatedAt: new Date(),
            }
        }),
        prisma.registrationCode.update({
            where: { id: registrationCode.id },
            data: {
                usedCount: { increment: 1 }
            }
        })
    ])

    revalidatePath(`/${gym.slug}/settings/billing`)
    revalidatePath(`/${gym.slug}/dashboard`)
    
    return { success: true }
}
