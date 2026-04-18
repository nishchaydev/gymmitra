import { StaffRepository } from "./repository"
import { CreateStaffInput } from "./validator"
import { createAdminClient } from "@/lib/supabase/admin"
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
     * 4. Sends magic link via Email (no plaintext passwords)
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

        // 2. Auth Identity Generation — random password for Supabase (never exposed to user)
        const tempPwd = randomBytes(16).toString('hex') // Strong random, never shared
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

        // 3. Database Persistence — no temp password stored
        try {
            const staff = await StaffRepository.create({
                ...input,
                gymId: gym.id,
                userId: supabaseUserId,
                isActive: true,
                isFirstLogin: true,
            })

            // 4. Generate magic link + send email (non-blocking)
            this.sendMagicLinkEmail(gym, input, supabaseAdmin).catch(err => {
                console.error('[StaffService] Failed to send magic link email:', err)
            })

            return staff
        } catch (dbError: any) {
            // Clean up auth user if DB write fails
            await supabaseAdmin.auth.admin.deleteUser(supabaseUserId)
            throw dbError
        }
    }

    private static async sendMagicLinkEmail(
        gym: { name: string; logoUrl?: string | null; logo?: string | null },
        input: CreateStaffInput,
        supabaseAdmin: ReturnType<typeof createAdminClient>
    ) {
        const baseUrl = getBaseUrl()

        // Generate a secure recovery link — staff clicks this to set their own password
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: input.email,
            options: { redirectTo: `${baseUrl}/auth/callback?next=/reset-password` }
        })

        if (linkError || !linkData?.properties?.action_link) {
            console.error('[StaffService] Failed to generate magic link:', linkError)
            throw new Error('Failed to generate password setup link')
        }

        const setPasswordUrl = linkData.properties.action_link

        await sendEmail({
            from: FROM_EMAIL,
            to: input.email,
            subject: `Set your password for ${gym.name}`,
            react: React.createElement(StaffCredentialEmail, {
                gymName: gym.name,
                gymLogo: gym.logoUrl || gym.logo,
                staffName: input.name,
                role: input.role,
                email: input.email,
                setPasswordUrl,
                loginUrl: `${baseUrl}/login`,
            }) as React.ReactElement
        })
    }
}

