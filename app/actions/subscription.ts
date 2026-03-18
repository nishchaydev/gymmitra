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

        // Process the activation inside a transaction
        await prisma.$transaction(async (tx) => {
            // Re-verify the code inside the transaction to prevent race conditions
            const registrationCode = await tx.registrationCode.findUnique({
                where: { code: code.trim() },
            });

            if (!registrationCode || !registrationCode.isActive) {
                throw new Error("Invalid or inactive license key");
            }

            if (registrationCode.usedCount >= registrationCode.maxUses) {
                throw new Error("License key has reached its maximum uses");
            }

            if (registrationCode.expiresAt && new Date() > new Date(registrationCode.expiresAt)) {
                throw new Error("License key has expired");
            }

            // Atomically increment the usedCount only if it's still below maxUses
            const updateResult = await tx.registrationCode.updateMany({
                where: {
                    id: registrationCode.id,
                    usedCount: { lt: registrationCode.maxUses },
                    isActive: true
                },
                data: {
                    usedCount: { increment: 1 },
                    // If this was the last use, we'll mark as inactive later or rely on the lt check
                }
            });

            if (updateResult.count === 0) {
                throw new Error("This code has just been reached its maximum uses by another user");
            }

            // Update isActive status if it's now used up
            if ((registrationCode.usedCount + 1) >= registrationCode.maxUses) {
                await tx.registrationCode.update({
                    where: { id: registrationCode.id },
                    data: { isActive: false }
                });
            }

            // Update gym profile
            await tx.gymProfile.update({
                where: { id: auth.gym.id },
                data: {
                    saasPlan: registrationCode.plan,
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
