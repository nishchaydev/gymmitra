import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { GymProfile, Role } from '@prisma/client'
import { NextResponse } from 'next/server'
import { cache } from 'react'

export type AuthContext = {
    gym: GymProfile;
    role: 'OWNER' | Role;
    staffId?: string;
    userId: string;
}

/**
 * Gets the current authenticated user's context (Gym and Role).
 * Required for all API endpoints and protected pages.
 * Wrapped in React cache() to memoize result per-request.
 */
export const getAuthGym = cache(async (): Promise<AuthContext | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()

    if (error || !data?.user) {


        if (error && error.status !== 401 && error.message !== 'Auth session missing!') {
            console.error("Auth context error:", error.message)
        }
        return null
    }

    const { user } = data

    // 1. Check if user is an Owner (Creator of the Gym)
    const gymAsOwner = await prisma.gymProfile.findUnique({
        where: { userId: user.id }
    })

    if (gymAsOwner) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Auth] User ${user.id} matched Gym Owner role for gym: ${gymAsOwner.slug}`)
        }
        return { gym: gymAsOwner, role: 'OWNER', userId: user.id }
    }

    // 2. Check if user is Staff/Trainer
    const staffProfile = await prisma.staffMember.findFirst({
        where: { userId: user.id, isActive: true },
        include: { gym: true }
    })

    if (staffProfile) {
        return {
            gym: staffProfile.gym,
            role: staffProfile.role,
            staffId: staffProfile.id,
            userId: user.id
        }
    }



    if (process.env.NODE_ENV === 'development') {
        console.warn(`[Auth] User ${user.id} has no matching GymProfile or StaffMember record.`)
    }
    return null
})

/**
 * Checks if the authenticated user's role is in the allowed list.
 * Returns a 403 NextResponse if not authorized, or null if allowed.
 */
export function checkRole(auth: AuthContext, allowedRoles: string[]): NextResponse | null {
    if (!allowedRoles.includes(auth.role)) {
        return NextResponse.json(
            { error: 'Forbidden: insufficient permissions' },
            { status: 403 }
        )
    }
    return null
}

