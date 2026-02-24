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

    // Clear demo mode cookie if it exists
    const cookieStore = await cookies()
    cookieStore.delete('mitra_demo_mode')

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
            // Check if they are pre-registered as Staff by an Owner
            const existingStaff = await prisma.staffMember.findMany({
                where: { email: data.user.email! }
            })

            if (existingStaff.length > 0) {
                // Link their real Supabase userId to all their staff profiles (multi-gym support)
                await prisma.staffMember.updateMany({
                    where: { email: data.user.email! },
                    data: { userId: data.user.id, isActive: true }
                })
            } else {
                // Create a default Gym Profile for the new Owner user
                await prisma.gymProfile.create({
                    data: {
                        name: process.env.NEXT_PUBLIC_GYM_NAME || "My Gym",
                        email: data.user.email!,
                        phone: "0000000000", // Placeholder, user updates in settings
                        userId: data.user.id,
                    }
                })
            }
        } catch (dbError) {
            console.error('Error creating gym profile or linking staff:', dbError)
        }
    }

    if (!data.session) {
        // This usually means email confirmation is required
        redirect(`/login?message=${encodeURIComponent("Please check your email to confirm your account before logging in.")}`)
    }

    // Clear demo mode cookie if it exists
    const cookieStore = await cookies()
    cookieStore.delete('mitra_demo_mode')

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
