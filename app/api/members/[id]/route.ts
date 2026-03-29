import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { recordAuditLog } from '@/lib/audit-logger'
import { MemberService } from '@/src/modules/members/service'
import { memberUpdateSchema } from '@/src/modules/members/validator'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getAuthGym()
        if (!auth || !auth.gym || typeof auth.userId !== 'string') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const rl = await guardRateLimit(100, `${auth.userId}:members:get-id`)
        if (rl) return rl

        const { id } = await params
        const member = await prisma.member.findFirst({
            where: {
                id,
                gymId: auth.gym.id
            },
            include: {
                subscriptions: {
                    include: { plan: true },
                    orderBy: { endDate: 'desc' }
                },
                invoices: {
                    orderBy: { issueDate: 'desc' },
                    take: 5
                }
            }
        })

        if (!member) {
            return NextResponse.json(
                { error: 'Member not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(member)
    } catch (error) {
        console.error('Error fetching member:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getAuthGym()
        if (!auth || !auth.gym || typeof auth.userId !== 'string') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const rl = await guardRateLimit(30, `${auth.userId}:members:put`)
        if (rl) return rl

        // STAFF and above can update members
        const roleCheck = checkRole(auth, ['OWNER', 'STAFF'])
        if (roleCheck) return roleCheck

        const { id } = await params
        const body = await request.json()
        const validatedData = memberUpdateSchema.parse(body)

        const ipHeader = request.headers.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

        const result = await MemberService.updateMember(id, auth.gym.id, auth.userId, ip, validatedData)
        if (result.error) {
            return NextResponse.json({ error: result.error }, { status: result.status })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.issues },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to update member' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getAuthGym()
        if (!auth || !auth.gym || typeof auth.userId !== 'string') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const rl = await guardRateLimit(10, `${auth.userId}:members:delete`)
        if (rl) return rl

        // Only OWNER can delete members
        const roleCheck = checkRole(auth, ['OWNER'])
        if (roleCheck) return roleCheck

        const { id } = await params

        const result = await prisma.member.deleteMany({
            where: {
                id,
                gymId: auth.gym.id
            }
        })

        if (result.count === 0) {
            return NextResponse.json({ error: 'Member not found or unauthorized' }, { status: 404 })
        }

        // Audit Log
        const ipHeader = request.headers.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

        await recordAuditLog({
            gymId: auth.gym.id,
            actorId: auth.userId,
            action: 'DELETE_MEMBER',
            entityType: 'MEMBER',
            entityId: id,
            ipAddress: ip
        }).catch(err => console.error('recordAuditLog DELETE_MEMBER', err))

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Delete member error:', error)
        if (error.code === 'P2003' || error.code === 'P2014') {
            return NextResponse.json(
                { error: 'Cannot delete member because they have existing invoices, attendance, or active subscriptions. Try changing their status to Inactive instead.' },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to delete member' },
            { status: 500 }
        )
    }
}
