import { prisma } from "@/lib/prisma"
import { SaaSPlan, PlanTier } from "@prisma/client"

export class AdminRepository {
    /**
     * Get aggregate statistics for the entire platform
     */
    static async getPlatformStats() {
        const [
            gymCount,
            totalMembers,
            totalRevenue,
            activeTrials,
            recentOnboards
        ] = await Promise.all([
            prisma.gymProfile.count(),
            prisma.member.count(),
            prisma.invoice.aggregate({
                _sum: { amountPaid: true },
                where: { paymentStatus: 'PAID' }
            }),
            prisma.gymProfile.count({
                where: { saasPlan: SaaSPlan.TRIAL, trialExpiresAt: { gt: new Date() } }
            }),
            prisma.gymProfile.count({
                where: { createdAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
            })
        ])

        return {
            totalGyms: gymCount,
            totalMembers: totalMembers,
            totalRevenue: Number(totalRevenue._sum.amountPaid || 0),
            activeTrials: activeTrials,
            newGymsLast7Days: recentOnboards
        }
    }

    /**
     * List all gyms with their key metrics for the management table
     */
    static async listGyms(limit: number = 50, offset: number = 0) {
        return prisma.gymProfile.findMany({
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                slug: true,
                ownerName: true,
                email: true,
                phone: true,
                city: true,
                saasPlan: true,
                planTier: true,
                trialExpiresAt: true,
                onboardingStep: true,
                isVerified: true,
                createdAt: true,
                _count: {
                    select: { members: true }
                }
            }
        })
    }

    /**
     * Update gym settings from the admin dashboard
     */
    static async updateGym(id: string, data: {
        saasPlan?: SaaSPlan
        planTier?: PlanTier
        trialExpiresAt?: Date
        isVerified?: boolean
    }) {
        return prisma.gymProfile.update({
            where: { id },
            data
        })
    }
}
