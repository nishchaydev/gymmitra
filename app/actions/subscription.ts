"use server";

import { prisma } from "@/lib/prisma";
import { getAuthGym } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function activateSubscription(code: string) {
    const auth = await getAuthGym();
    if (!auth) {
        return { success: false, error: "Not authenticated" };
    }

    if (auth.role !== "OWNER") {
        return { success: false, error: "Only owners can activate subscriptions" };
    }

    try {
        const registrationCode = await prisma.registrationCode.findUnique({
            where: { code: code.trim() },
        });

        if (!registrationCode) {
            return { success: false, error: "Invalid activation code" };
        }

        if (!registrationCode.isActive) {
            return { success: false, error: "This code is no longer active" };
        }

        if (registrationCode.usedCount >= registrationCode.maxUses) {
            return { success: false, error: "This code has reached its maximum uses" };
        }

        if (registrationCode.expiresAt && new Date() > new Date(registrationCode.expiresAt)) {
            return { success: false, error: "This code has expired" };
        }

        // Process the activation
        await prisma.$transaction(async (tx) => {
            // Update code usage
            await tx.registrationCode.update({
                where: { id: registrationCode.id },
                data: {
                    usedCount: { increment: 1 },
                    // If this was the last use, mark as used up
                    isActive: (registrationCode.usedCount + 1) >= registrationCode.maxUses ? false : true,
                },
            });

            // Update gym profile
            // If the code doesn't specify trial days, assume lifetime for MAIN_PLAN unless otherwise specified
            await tx.gymProfile.update({
                where: { id: auth.gym.id },
                data: {
                    saasPlan: registrationCode.plan,
                    // Typically a purchased license code removes the trial expiry
                    trialExpiresAt: null, 
                    licenseKey: code.trim(),
                    licenseActivatedAt: new Date(),
                },
            });
        });

        // Revalidate the entire layout structure cache so the warning banner goes away
        revalidatePath(`/${auth.gym.slug}`, 'layout');
        
        return { success: true };
    } catch (error) {
        console.error("Subscription activation error:", error);
        return { success: false, error: "Failed to activate subscription" };
    }
}
