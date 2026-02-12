'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect(`/login?message=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const licenseKey = formData.get('license_key') as string

    // Security Check: Only allow signups with a valid license key
    const secretKey = process.env.REGISTRATION_SECRET || "MITRA2026"
    if (licenseKey !== secretKey) {
        redirect(`/login?view=register&message=${encodeURIComponent("Invalid License Key. Please contact your administrator to purchase a license.")}`)
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        redirect(`/login?message=${encodeURIComponent(error.message)}`)
    }

    if (data.user) {
        try {
            // Create a default Gym Profile for the new user
            await prisma.gymProfile.create({
                data: {
                    name: process.env.NEXT_PUBLIC_GYM_NAME || "My Gym",
                    email: data.user.email!,
                    phone: "0000000000", // Placeholder, user updates in settings
                    userId: data.user.id,
                }
            })
        } catch (dbError) {
            console.error('Error creating gym profile:', dbError)
        }
    }

    if (!data.session) {
        // This usually means email confirmation is required
        redirect(`/login?message=${encodeURIComponent("Please check your email to confirm your account before logging in.")}`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function demoLogin() {
    const cookieStore = await cookies()

    // Set a bypass cookie that lasts for 24 hours
    cookieStore.set('mitra_demo_mode', 'true', {
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
    })

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
