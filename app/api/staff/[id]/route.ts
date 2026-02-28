import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { recordAuditLog } from '@/lib/audit-logger'

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

        const deleted = await prisma.staffMember.deleteMany({
            where: { id, gymId: auth.gym.id }
        })

        if (deleted.count === 0) {
            return NextResponse.json({ error: 'Staff member not found or unauthorized' }, { status: 404 })
        }

        // Audit Log
        const ipHeader = request.headers.get('x-forwarded-for') || '127.0.0.1'
        const ip = ipHeader.split(',')[0].trim()
        await recordAuditLog({
            gymId: auth.gym.id,
            actorId: auth.userId,
            action: 'DELETE_MEMBER', // Using generic member/staff action or should define 'DELETE_STAFF'
            entityType: 'STAFF',
            entityId: id,
            ipAddress: ip
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
