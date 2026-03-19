'use server'

import { createClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gym.emitra.dev'

export async function resendVerificationEmail() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const userEmail = user?.email

        if (!userEmail) {
            return { success: false, error: 'No email found for current session. Please try signing up again.' }
        }

        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: userEmail,
            options: {
                emailRedirectTo: `${SITE_URL}/auth/callback`
            }
        })

        if (error) {
            console.error('[Resend Verification] Failed:', error)
            return { success: false, error: error.message }
        }

        return { success: true }
    } catch (err) {
        console.error('[Resend Verification] Unexpected error:', err)
        return { success: false, error: 'Something went wrong. Please try again.' }
    }
}
