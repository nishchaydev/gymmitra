import { AdminRepository } from "./repository"
import { SaaSPlan, PlanTier } from "@prisma/client"

export class AdminService {
    /**
     * Helper to verify if an email is in the admin whitelist
     */
    static isAdmin(email: string): boolean {
        const adminEmails = (process.env.ADMIN_EMAIL || '').split(',').map(e => e.trim()).filter(Boolean)
        return adminEmails.includes(email)
    }

    /**
     * Get consolidated dashboard metrics
     */
    static async getDashboardMetrics(adminEmail: string) {
        if (!this.isAdmin(adminEmail)) throw new Error('Unauthorized')
        return AdminRepository.getPlatformStats()
    }

    /**
     * Get a paginated list of gyms for management
     */
    static async getGymList(adminEmail: string, page: number = 1) {
        if (!this.isAdmin(adminEmail)) throw new Error('Unauthorized')
        const limit = 50
        const offset = (page - 1) * limit
        return AdminRepository.listGyms(limit, offset)
    }

    /**
     * Admin action: Verify a gym manually
     */
    static async verifyGym(adminEmail: string, gymId: string) {
        if (!this.isAdmin(adminEmail)) throw new Error('Unauthorized')
        return AdminRepository.updateGym(gymId, { isVerified: true })
    }

    /**
     * Admin action: Convert to PRO or extend trial
     */
    static async updatePlan(adminEmail: string, gymId: string, plan: SaaSPlan, tier: PlanTier, expiry?: Date) {
        if (!this.isAdmin(adminEmail)) throw new Error('Unauthorized')
        return AdminRepository.updateGym(gymId, {
            saasPlan: plan,
            planTier: tier,
            trialExpiresAt: expiry
        })
    }
}
