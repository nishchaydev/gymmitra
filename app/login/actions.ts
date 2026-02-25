'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { cookies, headers } from 'next/headers'
import { recordAuditLog } from '@/lib/audit-logger'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect(`/login?message=${encodeURIComponent(error.message)}`)
    }

    // Check real verification status to survive multi-device logins
    const gym = await prisma.gymProfile.findFirst({
        where: { userId: data.user?.id }
    })

    const isTrainerProfile = data.user && !gym ? await prisma.staffMember.findFirst({
        where: { userId: data.user.id }
    }) : null;

    const cookieStore = await cookies()
    cookieStore.delete('mitra_demo_mode')

    if (gym?.isVerified || isTrainerProfile) {
        cookieStore.set('gym_onboarded', 'true', {
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        })
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = (formData.get('email') as string)?.toLowerCase().trim()
    const password = formData.get('password') as string
    const licenseKey = formData.get('license_key') as string

    if (!email || !password || !licenseKey) {
        return redirect(`/login?view=register&message=${encodeURIComponent("All fields are required.")}`)
    }

    let signupResult;
    try {
        signupResult = await prisma.$transaction(async (tx) => {
            // 1. Validate Registration Code
            const regCode = await tx.registrationCode.findUnique({
                where: { code: licenseKey }
            });

            if (!regCode || !regCode.isActive || (regCode.expiresAt && regCode.expiresAt < new Date())) {
                throw new Error("Invalid or expired Registration Code.")
            }

            if (regCode.usedCount >= regCode.maxUses) {
                throw new Error("Registration Code has reached maximum uses.")
            }

            // 2. Atomic increment with Optimistic Locking
            const updateResult = await tx.registrationCode.updateMany({
                where: {
                    id: regCode.id,
                    usedCount: regCode.usedCount // Ensure no one else incremented it between our find and update
                },
                data: {
                    usedCount: { increment: 1 }
                }
            });

            if (updateResult.count === 0) {
                throw new Error("Registration busy. Please try again.")
            }

            // 3. Auth signup
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            })

            if (error) throw error;
            if (!data.user) throw new Error("Failed to create user account.");

            // 4. Link Profiles
            const existingStaff = await tx.staffMember.findMany({
                where: { email, userId: null }
            });

            let targetGymId = null;

            if (existingStaff.length > 0) {
                await tx.staffMember.updateMany({
                    where: { email, userId: null },
                    data: { userId: data.user.id, isActive: true }
                });
                targetGymId = existingStaff[0].gymId;
            } else {
                const newGym = await tx.gymProfile.create({
                    data: {
                        name: process.env.NEXT_PUBLIC_GYM_NAME || "My Gym",
                        email: email,
                        phone: "0000000000",
                        userId: data.user.id,
                        saasPlan: regCode.plan,
                        isVerified: false,
                        onboardingStep: 0
                    }
                });
                targetGymId = newGym.id;
            }

            // Complete the code link
            await tx.registrationCode.update({
                where: { id: regCode.id },
                data: { gymId: targetGymId }
            });

            return { userId: data.user.id, gymId: targetGymId, session: data.session };
        });
    } catch (error: any) {
        console.error('Registration failed:', error.message);
        return redirect(`/login?view=register&message=${encodeURIComponent(error.message || "Registration failed")}`);
    }

    // 5. Record Audit Log (After Transaction Success)
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for') || '127.0.0.1';

    await recordAuditLog({
        gymId: signupResult.gymId!,
        actorId: signupResult.userId,
        action: 'SIGNUP',
        entityType: 'AUTH',
        entityId: signupResult.userId,
        ipAddress: ip,
        payload: { email }
    });

    if (!signupResult.session) {
        return redirect(`/login?message=${encodeURIComponent("Please check your email to confirm your account before logging in.")}`)
    }

    const cookieStore = await cookies()
    cookieStore.delete('mitra_demo_mode')

    revalidatePath('/', 'layout')
    return redirect('/dashboard')
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
