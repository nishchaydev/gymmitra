import { AdminRepository } from "./repository"
import { SaaSPlan, PlanTier } from "@prisma/client"
import { sendBatch, FROM_EMAIL } from "@/lib/email"

// Cache admin emails at module load — normalized to lowercase
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

export class AdminService {
    /**
     * Helper to verify if an email is in the admin whitelist (case-insensitive)
     */
    static isAdmin(email: string): boolean {
        if (!email) return false
        return ADMIN_EMAILS.includes(email.trim().toLowerCase())
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

    /**
     * REGISTRATION CODES
     */
    static async createRegistrationCode(adminEmail: string, code: string, plan: SaaSPlan, maxUses: number, daysValid: number) {
        if (!this.isAdmin(adminEmail)) throw new Error('Unauthorized')
        return AdminRepository.createRegistrationCode(code.toUpperCase().trim(), plan, maxUses, daysValid)
    }

    static async listRegistrationCodes(adminEmail: string) {
        if (!this.isAdmin(adminEmail)) throw new Error('Unauthorized')
        return AdminRepository.listRegistrationCodes()
    }

    static async deleteRegistrationCode(adminEmail: string, codeId: string) {
        if (!this.isAdmin(adminEmail)) throw new Error('Unauthorized')
        return AdminRepository.deleteRegistrationCode(codeId)
    }

    /**
     * BROADCAST SYSTEM
     */
    static async broadcastEmail(adminEmail: string, subject: string, htmlMessage: string) {
        if (!this.isAdmin(adminEmail)) throw new Error('Unauthorized')
        
        try {
            const gyms = await AdminRepository.getAllVerifiedGymEmails()
            if (gyms.length === 0) return { sentCount: 0, failedCount: 0 }

            const emails = gyms.map(gym => ({
                from: FROM_EMAIL,
                to: [gym.email],
                subject: subject,
                html: `
                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2>Hello ${gym.ownerName || 'Gym Owner'},</h2>
                        <div style="font-size: 16px; line-height: 1.6;">
                            ${htmlMessage}
                        </div>
                        <p style="color: #666; font-size: 14px; margin-top: 40px;">
                            Best regards,<br>
                            <strong>Nishchay Gupta</strong><br>
                            Founder, GymMitra
                        </p>
                    </div>
                `
            }))

            const result = await sendBatch(emails)
            return { sentCount: result.sent, failedCount: result.failed }
        } catch (err) {
            console.error('[Admin Broadcast Setup Error]', err)
            throw new Error('Failed to setup broadcast system')
        }
    }
}
