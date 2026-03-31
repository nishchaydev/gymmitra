import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'

/**
 * PATCH /api/staff/first-login
 * Clears the isFirstLogin flag and tempPassword for the authenticated staff member.
 * Called from the first-login page after the staff makes their password decision.
 */
export async function PATCH() {
    try {
        const auth = await getAuthGym()
        if (!auth || !auth.staffId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await prisma.staffMember.update({
            where: { id: auth.staffId },
            data: {
                isFirstLogin: false,
                tempPassword: null, // Clear encrypted temp password — no longer needed
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Staff FirstLogin PATCH] Error:', error)
        return NextResponse.json({ error: 'Failed to update first-login status' }, { status: 500 })
    }
}
