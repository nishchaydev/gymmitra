import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { recordAuditLog } from '@/lib/audit-logger'

// No force-dynamic

const leadUpdateSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits').optional(),
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

        const roleCheck = checkRole(auth, ['OWNER', 'MANAGER', 'STAFF', 'FRONT_DESK'])
        if (roleCheck) return roleCheck

        const rateLimited = await guardRateLimit(30, `${auth.userId}:leads:put`)
        if (rateLimited) return rateLimited

        // Verify ownership
        const existing = await prisma.lead.findFirst({
            where: { id, gymId: auth.gym.id },
        })
        if (!existing) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        }

        const body = await request.json()
        const validatedData = leadUpdateSchema.parse(body)

        // Track conversion
        const isConverting = validatedData.status === 'CONVERTED' && existing.status !== 'CONVERTED'

        const lead = await prisma.lead.update({
            where: { id, gymId: auth.gym.id },
            data: {
                ...validatedData,
                ...(isConverting ? { convertedAt: new Date() } : {}),
            },
        })

        // Audit log for conversion
        if (isConverting) {
            const ipHeader = request.headers.get('x-forwarded-for')
            const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

            await recordAuditLog({
                gymId: auth.gym.id,
                actorId: auth.userId,
                action: 'CONVERT_LEAD',
                entityType: 'LEAD',
                entityId: lead.id,
                ipAddress: ip,
                payload: { name: lead.name, phone: lead.phone },
            })
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
        return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 })
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

        // Verify ownership
        const existing = await prisma.lead.findFirst({
            where: { id, gymId: auth.gym.id },
        })
        if (!existing) {
            return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
        }

        await prisma.lead.deleteMany({ where: { id, gymId: auth.gym.id } })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error deleting lead:', {
            message: error.message,
            stack: error.stack
        })
        return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 })
    }
}
