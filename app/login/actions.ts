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
    const licenseKey = (formData.get('license_key') as string)?.trim()

    if (!email || !password || !licenseKey) {
        return redirect(`/login?view=register&message=${encodeURIComponent("All fields are required.")}`)
    }

    // 1. Pre-Validate Registration Code before Supabase network call
    const regCodePreCheck = await prisma.registrationCode.findUnique({
        where: { code: licenseKey }
    });

    if (!regCodePreCheck || !regCodePreCheck.isActive || (regCodePreCheck.expiresAt && regCodePreCheck.expiresAt < new Date())) {
        return redirect(`/login?view=register&message=${encodeURIComponent("Invalid or expired Registration Code.")}`)
    }
    if (regCodePreCheck.usedCount >= regCodePreCheck.maxUses) {
        return redirect(`/login?view=register&message=${encodeURIComponent("Registration Code has reached maximum uses.")}`)
    }

    // 2. Supabase Signup (External network call, pulled out of DB transaction)
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    })

    if (authError || !authData.user) {
        return redirect(`/login?view=register&message=${encodeURIComponent(authError?.message || "Failed to create user account.")}`)
    }

    let signupResult;
    try {
        signupResult = await prisma.$transaction(async (tx) => {
            const regCode = await tx.registrationCode.findUnique({
                where: { code: licenseKey }
            });

            if (!regCode || regCode.usedCount >= regCode.maxUses) {
                throw new Error("Registration Code invalidated during sign-up. Please contact support.")
            }

            // 3. Atomic increment with Optimistic Locking
            const updateResult = await tx.registrationCode.updateMany({
                where: {
                    id: regCode.id,
                    usedCount: regCode.usedCount // Ensure no one else incremented it
                },
                data: {
                    usedCount: { increment: 1 },
                    isActive: regCode.usedCount + 1 < regCode.maxUses
                }
            });

            if (updateResult.count === 0) {
                throw new Error("Registration busy. Please try again.")
            }

            // 4. Link Profiles
            const existingStaff = await tx.staffMember.findMany({
                where: { email, userId: null }
            });

            // Target gym conceptually is an array for multiple-gym workers
            let targetGymIds: string[] = [];

            if (existingStaff.length > 0) {
                await tx.staffMember.updateMany({
                    where: { email, userId: null },
                    data: { userId: authData.user!.id, isActive: true }
                });
                targetGymIds = existingStaff.map(s => s.gymId);
            } else {
                const newGym = await tx.gymProfile.create({
                    data: {
                        name: "My Gym",
                        email: email,
                        phone: "0000000000",
                        userId: authData.user!.id,
                        registrationCodeId: regCode.id,
                        saasPlan: regCode.plan,
                        isVerified: false,
                        onboardingStep: 0
                    }
                });
                targetGymIds = [newGym.id];
            }

            // Complete the code link (assuming it links to the primary gym)
            if (targetGymIds[0]) {
                await tx.gymProfile.update({
                    where: { id: targetGymIds[0] },
                    data: { registrationCodeId: regCode.id }
                });
            }

            return { userId: authData.user!.id, gymId: targetGymIds[0], session: authData.session };
        });
    } catch (error: any) {
        console.error('Registration linked failed:', error.message);
        // Sanitize generic errors escaping to UI
        return redirect(`/login?view=register&message=${encodeURIComponent("Could not complete registration. Ensure the code is valid.")}`);
    }

    // 5. Record Audit Log (After Transaction Success)
    if (signupResult?.gymId) {
        const headerList = await headers();
        const ipHeader = headerList.get('x-forwarded-for');
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1';

        await recordAuditLog({
            gymId: signupResult.gymId,
            actorId: signupResult.userId,
            action: 'SIGNUP',
            entityType: 'AUTH',
            entityId: signupResult.userId,
            ipAddress: ip,
            payload: { email }
        }).catch(err => console.error('recordAuditLog SIGNUP', err));
    }

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
