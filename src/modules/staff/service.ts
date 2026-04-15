import { StaffRepository } from "./repository"
import { CreateStaffInput } from "./validator"
import { createAdminClient } from "@/lib/supabase/admin"
import { encryptPassword } from "@/lib/crypto"
import { randomBytes } from "crypto"
import React from "react"
import { StaffCredentialEmail } from "@/components/emails/StaffCredentialEmail"
import { getBaseUrl } from "@/lib/utils"
import { sendEmail, FROM_EMAIL } from "@/lib/email"

export class StaffService {
    /**
     * Lists all staff members for a gym
     */
    static async listStaff(gymId: string) {
        return StaffRepository.findByGym(gymId)
    }

    /**
     * Handles the complex orchestration of creating a staff member:
     * 1. Validates uniqueness
     * 2. Creates identity in Supabase Auth
     * 3. Creates profile in DB
     * 4. Sends credentials via Email
     */
    static async createStaff(
        gym: { id: string; name: string; logoUrl?: string | null; logo?: string | null },
        input: CreateStaffInput
    ) {
        // 1. Business Validation
        const existing = await StaffRepository.findByEmail(input.email, gym.id)
        if (existing) {
            throw new Error('A staff member with this email already exists in your gym')
        }

        // 2. Auth Identity Generation
        const tempPwd = randomBytes(5).toString('hex')
        const supabaseAdmin = createAdminClient()
        
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: input.email,
            password: tempPwd,
            email_confirm: true,
        })

        if (authError) {
            if (authError.message?.includes('already been registered')) {
                throw new Error('This email is already registered in the system. Ask the staff member to log in directly.')
            }
            throw new Error(`Failed to create auth account: ${authError.message}`)
        }

        const supabaseUserId = authData.user.id

        // 3. Database Persistence
        try {
            const staff = await StaffRepository.create({
                ...input,
                gymId: gym.id,
                userId: supabaseUserId,
                isActive: true,
                isFirstLogin: true,
                tempPassword: encryptPassword(tempPwd),
            })

            // 4. Background: Send Credentials (non-blocking)
            this.sendCredentialsEmail(gym, input, tempPwd).catch(err => {
                console.error('[StaffService] Failed to send credentials email:', err)
            })

            return staff
        } catch (dbError: any) {
            // Clean up auth user if DB write fails
            await supabaseAdmin.auth.admin.deleteUser(supabaseUserId)
            throw dbError
        }
    }

    private static async sendCredentialsEmail(
        gym: { name: string; logoUrl?: string | null; logo?: string | null },
        input: CreateStaffInput,
        tempPwd: string
    ) {
        await sendEmail({
            from: FROM_EMAIL,
            to: input.email,
            subject: `Your login credentials for ${gym.name}`,
            react: React.createElement(StaffCredentialEmail, {
                gymName: gym.name,
                gymLogo: gym.logoUrl || gym.logo,
                staffName: input.name,
                role: input.role,
                email: input.email,
                temporaryPassword: tempPwd,
                loginUrl: `${getBaseUrl()}/login`,
            }) as React.ReactElement
        })
    }
}
