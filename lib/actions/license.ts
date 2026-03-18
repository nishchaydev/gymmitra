import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getAuthGym } from "@/lib/auth"

export async function activateLicense(licenseKey: string) {
    const { gym, user } = await getAuthGym()
    
    // 1. Basic validation
    if (!licenseKey || licenseKey.length < 10) {
        throw new Error("Invalid license key format")
    }

    // 2. Verify license key (In a real app, this would check a 'Licenses' table or external API)
    // For now, we simulate a check. Let's assume keys starting with 'GM-' are valid.
    if (!licenseKey.startsWith("GM-")) {
        throw new Error("Invalid or inactive license key")
    }

    // 3. Update GymProfile
    await prisma.gymProfile.update({
        where: { id: gym.id },
        data: {
            saasPlan: 'MAIN_PLAN',
            licenseKey: licenseKey,
            licenseActivatedAt: new Date(),
            // Clear trial expiry if any (or keep for record)
        }
    })

    revalidatePath(`/${gym.slug}/settings/billing`)
    revalidatePath(`/${gym.slug}/dashboard`)
    
    return { success: true }
}
