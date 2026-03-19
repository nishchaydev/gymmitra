'use server'

import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://gym.emitra.dev'

// Simple in-memory rate limit for resend actions
const rateLimit = new Map<string, { count: number, timestamp: number }>()

export async function resendVerificationEmail(email?: string) {
    try {
        // Rate limiting
        const headerList = await headers()
        const ip = headerList.get('x-forwarded-for') || 'unknown-ip'
        const now = Date.now()
        const limitRecord = rateLimit.get(ip)
        
        if (limitRecord && now - limitRecord.timestamp < 60000) {
            if (limitRecord.count >= 3) {
                return { success: false, error: 'Too many requests. Please wait a minute before trying again.' }
            }
            limitRecord.count++
        } else {
            rateLimit.set(ip, { count: 1, timestamp: now })
        }

        const supabase = await createClient()
        let userEmail = email

        if (!userEmail) {
            const { data: { user } } = await supabase.auth.getUser()
            userEmail = user?.email
        }

        if (!userEmail) {
            return { success: false, error: 'No email found to resend verification. Please try signing up again.' }
        }

        // Validate that the email belongs to an authorized/pending account
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
            if (authUser.email !== userEmail) {
                return { success: false, error: 'Unauthorized email address.' }
            }
        } else {
            // Unauthenticated check: verify the email exists as a pending profile in DB
            const pendingProfile = await prisma.gymProfile.findFirst({
                where: { email: userEmail },
                select: { id: true }
            })
            // We only check if record exists, if it does, it's safe to fire resend on our system.
            if (!pendingProfile) {
                return { success: false, error: 'No pending registration found for this email.' }
            }
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
