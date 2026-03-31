import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { recordAuditLog } from '@/lib/audit-logger'
import { createAdminClient } from '@/lib/supabase/admin'

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
        const staffMember = await prisma.staffMember.findFirst({
            where: { id, gymId: auth.gym.id },
            select: { userId: true }
        })
        if (!staffMember) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        if (staffMember.userId === auth.userId) {
            return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
        }

        const deleted = await prisma.staffMember.deleteMany({
            where: { id, gymId: auth.gym.id }
        })

        if (deleted.count === 0) {
            return NextResponse.json({ error: 'Staff member not found or unauthorized' }, { status: 404 })
        }

        // Delete the Supabase auth user so the fired staff member cannot log in.
        // This is fire-and-forget — a DB-only delete already denies API access via
        // getAuthGym(), but removing the Supabase user also invalidates any live
        // session cookies immediately.
        try {
            if (staffMember.userId) {
                const supabaseAdmin = createAdminClient()
                await supabaseAdmin.auth.admin.deleteUser(staffMember.userId)
            }
        } catch (authDeleteErr) {
            console.error('[Staff DELETE] Failed to delete Supabase auth user:', authDeleteErr)
            // Non-fatal: the DB record is gone, getAuthGym() will return null for
            // this user. Log and continue.
        }

        // Audit Log
        const ipHeader = request.headers.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'
        await recordAuditLog({
            gymId: auth.gym.id,
            actorId: auth.userId,
            action: 'DELETE_STAFF' as any,
            entityType: 'STAFF',
            entityId: id,
            ipAddress: ip
        }).catch(err => console.error('recordAuditLog DELETE_STAFF', err))

        return NextResponse.json({ message: 'Staff member removed successfully' })
    } catch (error) {
        console.error(`Failed to delete staff member:`, error)
        return NextResponse.json(
            { error: 'Failed to delete staff member' },
            { status: 500 }
        )
    }
}
