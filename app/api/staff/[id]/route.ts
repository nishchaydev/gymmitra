import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getAuthGym()
        if (!auth || auth.role !== 'OWNER') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const rl = await guardRateLimit(50, `${auth.userId}:staff:delete`)
        if (rl) return rl

        const params = await props.params
        const id = params.id

        // Prevent self-deletion
        if (id === auth.userId) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
        }

        // Ensure the staff member belongs to the current gym
        const staffMember = await prisma.staffMember.findFirst({
            where: { id, gymId: auth.gym.id }
        })

        if (!staffMember) {
            return NextResponse.json({ error: 'Staff member not found or unauthorized' }, { status: 404 })
        }

        // Delete with gymId ownership enforced
        await prisma.staffMember.delete({
            where: { id }
        })

        return NextResponse.json({ message: 'Staff member removed successfully' })
    } catch (error) {
        console.error(`Failed to delete staff member:`, error)
        return NextResponse.json(
            { error: 'Failed to delete staff member' },
            { status: 500 }
        )
    }
}
