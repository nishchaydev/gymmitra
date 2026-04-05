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

    // 1 & 2. Check if user is an Owner OR Staff/Trainer (combined query via gym relation)
    const gymWithAuth = await prisma.gymProfile.findFirst({
        where: {
            OR: [
                { userId: user.id },
                { staff: { some: { userId: user.id, isActive: true } } }
            ]
        },
        include: {
            staff: {
                where: { userId: user.id, isActive: true },
                orderBy: { createdAt: 'asc' },
                take: 1
            }
        }
    })

    if (gymWithAuth) {
        if (gymWithAuth.userId === user.id) {
            if (process.env.NODE_ENV === 'development') {
                console.log(`[Auth] User ${user.id} matched Gym Owner role for gym: ${gymWithAuth.slug}`)
            }
            // Strip out staff relation before returning gym context
            const { staff, ...gymWithoutStaff } = gymWithAuth
            return { gym: gymWithoutStaff as GymProfile, role: 'OWNER', userId: user.id }
        }

        const staffProfile = gymWithAuth.staff[0]
        if (staffProfile) {
            // Strip out staff relation before returning gym context
            const { staff, ...gymWithoutStaff } = gymWithAuth
            return {
                gym: gymWithoutStaff as GymProfile,
                role: staffProfile.role,
                staffId: staffProfile.id,
                userId: user.id
            }
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

