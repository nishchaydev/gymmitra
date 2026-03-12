import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { recordAuditLog } from '@/lib/audit-logger'

export const dynamic = 'force-dynamic'

const leadCreateSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    phone: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
    email: z.string().email().optional().or(z.literal('')),
    planInterest: z.string().optional(),
    source: z.string().optional(),
    notes: z.string().optional(),
    followUpDate: z.string()
        .refine(val => !val || !isNaN(Date.parse(val)), { message: 'Invalid date format' })
        .transform(str => str ? new Date(str) : undefined)
        .optional(),
})

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const rateLimited = await guardRateLimit(100, `${auth.userId}:leads:get`)
        if (rateLimited) return rateLimited

        // Runtime check for Lead model existence (handles stale Prisma Client generations)
        if (!(prisma as any).lead) {
            console.error('[Leads API] Prisma client is stale. Lead model not found.')
            return NextResponse.json({
                error: 'Database client sync required',
                details: 'The Lead model is missing from the generated client. Please run "npx prisma generate".'
            }, { status: 500 })
        }

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const q = searchParams.get('q') || ''
        const parsedPage = parseInt(searchParams.get('page') || '1', 10)
        const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage)
        const parsedTake = parseInt(searchParams.get('take') || '50', 10)
        const take = Math.min(100, Math.max(1, isNaN(parsedTake) ? 50 : parsedTake))
        const skip = (page - 1) * take

        const validStatuses = ['NEW', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'CONVERTED']
        const isValidStatus = status && status !== 'ALL' && validStatuses.includes(status)

        const whereClause: any = {
            gymId: auth.gym.id,
            ...(isValidStatus ? { status: status as any } : {}),
            ...(q
                ? {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' } },
                        { phone: { contains: q } },
                        { email: { contains: q, mode: 'insensitive' } },
                    ],
                }
                : {}),
        }

        const [leads, totalCount] = await Promise.all([
            (prisma as any).lead.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take,
                skip,
            }),
            (prisma as any).lead.count({ where: whereClause }),
        ])

        return NextResponse.json({ leads, totalCount, page, hasMore: totalCount > page * take })
    } catch (error: any) {
        console.error('Error fetching leads:', {
            message: error.message,
            stack: error.stack,
            code: error.code
        })
        return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const roleCheck = checkRole(auth, ['OWNER', 'STAFF'])
        if (roleCheck) return roleCheck

        const rateLimited = await guardRateLimit(30, `${auth.userId}:leads:post`)
        if (rateLimited) return rateLimited

        // Runtime check for Lead model
        if (!(prisma as any).lead) {
            console.error('[Leads API] Prisma client is stale. Lead model not found.')
            return NextResponse.json({ error: 'Database client sync required' }, { status: 500 })
        }

        let body
        try {
            body = await request.json()
        } catch (e) {
            return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 })
        }
        const validatedData = leadCreateSchema.parse(body)

        const lead = await (prisma as any).lead.create({
            data: {
                gymId: auth.gym.id,
                name: validatedData.name,
                phone: validatedData.phone,
                email: validatedData.email || null,
                planInterest: validatedData.planInterest || null,
                source: validatedData.source || null,
                notes: validatedData.notes || null,
                followUpDate: validatedData.followUpDate || null,
            },
        })

        recordAuditLog({
            gymId: auth.gym.id,
            actorId: auth.userId,
            action: 'CREATE_LEAD',
            entityType: 'LEAD',
            entityId: lead.id,
            payload: { name: lead.name, phone: lead.phone ? lead.phone.slice(-4).padStart(lead.phone.length, '*') : null, source: lead.source },
        }).catch(err => console.error('[Leads] Audit logging failed:', err))

        return NextResponse.json({ lead }, { status: 201 })
    } catch (error: any) {
        if (error?.name === 'ZodError') {
            return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 })
        }
        console.error('Error creating lead:', {
            message: error.message,
            stack: error.stack
        })
        return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
    }
}
