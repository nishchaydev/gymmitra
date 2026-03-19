'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { cookies, headers } from 'next/headers'
import { recordAuditLog } from '@/lib/audit-logger'
import { getBaseUrl } from '@/lib/utils'

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
        where: { userId: data.user.id },
        include: { gym: true }
    }) : null;

    // #region agent log
    fetch('http://127.0.0.1:7246/ingest/9fabe3c7-5a18-4ee1-8658-5542d056de00', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': '69a8f3'
        },
        body: JSON.stringify({
            sessionId: '69a8f3',
            runId: 'pre-fix',
            hypothesisId: 'H3-login-flow',
            location: 'app/login/actions.ts:login:post-auth',
            message: 'Login succeeded; resolving gym/staff profile',
            data: {
                userId: data.user?.id || null,
                hasGym: !!gym,
                hasStaffProfile: !!(!!(data.user && !gym) ? await prisma.staffMember.findFirst({
                    where: { userId: data.user.id },
                    select: { id: true }
                }) : null)
            },
            timestamp: Date.now()
        })
    }).catch(() => { })
    // #endregion agent log

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

    if (gym && !gym.isVerified) {
        return redirect('/onboarding')
    }

    revalidatePath('/', 'layout')
    const finalSlug = (gym as any)?.slug || (isTrainerProfile as any)?.gym?.slug || 'gym'
    redirect(`/${finalSlug}/dashboard`)
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

    // Get current origin for reliable redirect (fixes PKCE mismatch on custom domains)
    const headerList = await headers()
    const host = headerList.get('host')
    const protocol = headerList.get('x-forwarded-proto') || 'https'
    const origin = `${protocol}://${host}`

    // 2. Supabase Signup (External network call, pulled out of DB transaction)
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
        },
    })

    if (authError || !authData.user) {
        return redirect(`/login?view=register&message=${encodeURIComponent(authError?.message || "Failed to create user account.")}`)
    }

    let signupResult;
    try {
        signupResult = await prisma.$transaction(async (tx) => {
            // First, fetch the code to check usedCount against maxUses
            const regCodeCheck = await tx.registrationCode.findUnique({
                where: { code: licenseKey }
            });

            if (!regCodeCheck || !regCodeCheck.isActive || (regCodeCheck.expiresAt && regCodeCheck.expiresAt < new Date())) {
                throw new Error("Invalid, expired, or deactivated Registration Code.")
            }

            if (regCodeCheck.usedCount >= regCodeCheck.maxUses) {
                throw new Error("Registration Code has reached maximum uses.")
            }

            // 1. Atomic update with full validation in where clause
            // This prevents TOCTOU (Time-of-Check to Time-of-Use) races
            const updateResult = await tx.registrationCode.updateMany({
                where: {
                    id: regCodeCheck.id,
                    usedCount: regCodeCheck.usedCount // Optimistic Concurrency Control
                },
                data: {
                    usedCount: { increment: 1 }
                }
            });

            if (updateResult.count === 0) {
                throw new Error("Registration busy. Please try again.")
            }

            // Fetch the updated code to continue with the signup
            const regCode = await tx.registrationCode.findUnique({
                where: { id: regCodeCheck.id }
            });

            if (!regCode) {
                throw new Error("Registration Code disappeared. Please contact support.")
            }

            // Update isActive status atomically if we hit the limit
            if (regCode.usedCount >= regCode.maxUses) {
                await tx.registrationCode.update({
                    where: { id: regCode.id },
                    data: { isActive: false }
                });
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
                const baseSlug = ((formData.get('gym_name') as string)?.toLowerCase().trim().replace(/[^a-z0-9]/g, '-') || email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') || 'gym').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'gym';
                const newGym = await tx.gymProfile.create({
                    data: {
                        name: "My Gym",
                        slug: `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`,
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

            // Only link gym if a new gym was created (not staff signup path)
            if (existingStaff.length === 0 && targetGymIds[0]) {
                await tx.gymProfile.update({
                    where: { id: targetGymIds[0] },
                    data: { registrationCodeId: regCode.id }
                });
            }

            return { userId: authData.user!.id, gymId: targetGymIds[0], session: authData.session };
        });
    } catch (error: any) {
        console.error('Registration failed:', error);

        // Clean up orphaned Supabase auth user to prevent dangling accounts
        if (authData?.user?.id) {
            try {
                // We use the admin client from the supabase instance
                await supabase.auth.admin.deleteUser(authData.user.id);
                console.log(`[Signup Cleanup] Deleted orphaned Supabase user: ${authData.user.id}`);
            } catch (cleanupErr) {
                console.error('[Signup Cleanup] Failed to delete orphaned Supabase user:', cleanupErr);
            }
        }

        // Sanitize generic errors escaping to UI
        let errorMessage = "Could not complete registration. Ensure the code is valid.";
        if (error && typeof error.message === 'string') {
            errorMessage = error.message.includes("Record to update not found")
                ? "Invalid or expired Registration Code."
                : error.message;
        } else if (error) {
            errorMessage = String(error);
        }

        return redirect(`/login?view=register&message=${encodeURIComponent(errorMessage)}`);
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

    // Fetch slug for signup redirect
    const userGym = await prisma.gymProfile.findFirst({
        where: { userId: signupResult.userId }
    })
    const staffGym = !userGym ? await prisma.staffMember.findFirst({
        where: { userId: signupResult.userId },
        include: { gym: true }
    }) : null

    const finalSlug = (userGym as any)?.slug || (staffGym as any)?.gym?.slug || 'gym'
    
    if (userGym && !userGym.isVerified) {
        return redirect('/onboarding')
    }

    return redirect(`/${finalSlug}/dashboard`)
}

export async function demoLogin() {
    const cookieStore = await cookies()

    // Set a bypass cookie that lasts for 24 hours
    cookieStore.set('mitra_demo_mode', 'true', {
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
    })

    revalidatePath('/', 'layout')
    redirect('/dashboard') // This will trigger the global redirect in app/dashboard/page.tsx
}
