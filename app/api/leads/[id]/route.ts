import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { recordAuditLog } from '@/lib/audit-logger'

// No force-dynamic

const leadUpdateSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().min(7).optional(),
    email: z.string().email().optional().or(z.literal('')).or(z.null()),
    planInterest: z.string().optional().or(z.null()),
    source: z.string().optional().or(z.null()),
    status: z.enum(['NEW', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'CONVERTED']).optional(),
    notes: z.string().optional().or(z.null()),
    followUpDate: z.string()
        .refine(val => !val || !isNaN(Date.parse(val)), { message: 'Invalid date format' })
        .transform(str => str ? new Date(str) : null)
        .optional()
        .or(z.null()),
})

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const auth = await getAuthGym()
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const roleCheck = checkRole(auth, ['OWNER', 'STAFF'])
        if (roleCheck) return roleCheck

        const rateLimited = await guardRateLimit(30, `${auth.userId}:leads:put`)
        if (rateLimited) return rateLimited

        // Runtime check for Lead model
        if (!(prisma as any).lead) {
            console.error('[Leads API] Prisma client is stale. Lead model not found.')
            return NextResponse.json({ error: 'Database client sync required' }, { status: 500 })
        }

        // Verify ownership
        const existing = await (prisma as any).lead.findFirst({
            where: { id, gymId: auth.gym.id },
        })
        if (!existing) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        }

        const body = await request.json()
        const validatedData = leadUpdateSchema.parse(body)

        // Track conversion
        const isConverting = validatedData.status === 'CONVERTED' && existing.status !== 'CONVERTED'

        const lead = await (prisma as any).lead.update({
            where: { id },
            data: {
                ...validatedData,
                ...(isConverting ? { convertedAt: new Date() } : {}),
            },
        })

        // Audit log for conversion
        if (isConverting) {
            recordAuditLog({
                gymId: auth.gym.id,
                actorId: auth.userId,
                action: 'CONVERT_LEAD',
                entityType: 'LEAD',
                entityId: lead.id,
                payload: { name: lead.name, phone: lead.phone },
            }).catch(err => console.error('[Leads] Audit logging failed:', err))
        }

        return NextResponse.json({ lead })
    } catch (error: any) {
        if (error?.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
        }
        console.error('Error updating lead:', {
            message: error.message,
            stack: error.stack
        })
        return NextResponse.json({ error: 'Failed to update lead', details: error.message }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const auth = await getAuthGym()
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // DELETE is OWNER only
        const roleCheck = checkRole(auth, ['OWNER'])
        if (roleCheck) return roleCheck

        const rateLimited = await guardRateLimit(20, `${auth.userId}:leads:delete`)
        if (rateLimited) return rateLimited

        // Runtime check for Lead model
        if (!(prisma as any).lead) {
            console.error('[Leads API] Prisma client is stale. Lead model not found.')
            return NextResponse.json({ error: 'Database client sync required' }, { status: 500 })
        }

        // Verify ownership
        const existing = await (prisma as any).lead.findFirst({
            where: { id, gymId: auth.gym.id },
        })
        if (!existing) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        }

        await (prisma as any).lead.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting lead:', {
            message: error.message,
            stack: error.stack
        })
        return NextResponse.json({ error: 'Failed to delete lead', details: error.message }, { status: 500 })
    }
}
