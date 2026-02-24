import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { GymProfile, Role } from '@prisma/client'

export type AuthContext = {
    gym: GymProfile;
    role: 'OWNER' | Role;
    staffId?: string;
    userId: string;
}

/**
 * Gets the current authenticated user's context (Gym and Role).
 * Required for all API endpoints and protected pages.
 */
export async function getAuthGym(): Promise<AuthContext | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // 1. Check if user is an Owner (Creator of the Gym)
    const gymAsOwner = await prisma.gymProfile.findUnique({
        where: { userId: user.id }
    })

    if (gymAsOwner) {
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

    return null
}
