import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { recordAuditLog } from '@/lib/audit-logger'
import { getIsDemo } from '@/lib/demo'

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
        const { searchParams } = new URL(request.url)
        const referer = request.headers.get('referer') || ''
        const urlObj = new URL(referer, 'http://localhost')
        const slug = urlObj.pathname.split('/')[1] || ''
        
        const isDemo = await getIsDemo(slug)
        const auth = await getAuthGym()

        if (!auth && !isDemo) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (isDemo && !auth) {
            // Return mock leads for demo mode
            const mockLeads = [
                { id: 'l1', name: 'Rahul Khanna', phone: '9876543210', status: 'NEW', source: 'Instagram', createdAt: new Date() },
                { id: 'l2', name: 'Sneha Rao', phone: '9123456789', status: 'CONTACTED', source: 'Facebook', createdAt: new Date() },
                { id: 'l3', name: 'Vikram Mehta', phone: '9988776655', status: 'INTERESTED', source: 'Walk-in', createdAt: new Date() }
            ]
            return NextResponse.json({ leads: mockLeads, totalCount: 3, page: 1, hasMore: false })
        }

        // Standard auth check for real users
        if (auth) {
            const roleCheck = checkRole(auth, ['OWNER', 'MANAGER', 'STAFF', 'FRONT_DESK'])
            if (roleCheck) return roleCheck
            
            const rateLimited = await guardRateLimit(100, `${auth.userId}:leads:get`)
            if (rateLimited) return rateLimited
        }
        const status = searchParams.get('status')
        const q = searchParams.get('q') || ''
        const parsedPage = parseInt(searchParams.get('page') || '1', 10)
        const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage)
        const parsedTake = parseInt(searchParams.get('take') || '50', 10)
        const take = Math.min(100, Math.max(1, isNaN(parsedTake) ? 50 : parsedTake))
        const skip = (page - 1) * take

        const validStatuses = ['NEW', 'CONTACTED', 'INTERESTED', 'NOT_INTERESTED', 'CONVERTED']
        const isValidStatus = status && status !== 'ALL' && validStatuses.includes(status)

        const whereClause = {
            gymId: auth.gym.id,
            ...(isValidStatus ? { status: status as import('@prisma/client').$Enums.LeadStatus } : {}),
            ...(q
                ? {
                    OR: [
                        { name: { contains: q, mode: 'insensitive' as const } },
                        { phone: { contains: q } },
                        { email: { contains: q, mode: 'insensitive' as const } },
                    ],
                }
                : {}),
        } satisfies import('@prisma/client').Prisma.LeadWhereInput;

        const [leads, totalCount] = await Promise.all([
            prisma.lead.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                take,
                skip,
            }),
            prisma.lead.count({ where: whereClause }),
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
        const referer = request.headers.get('referer') || ''
        const urlObj = new URL(referer, 'http://localhost')
        const slug = urlObj.pathname.split('/')[1] || ''
        
        const isDemo = await getIsDemo(slug)
        const auth = await getAuthGym()

        if (!auth && !isDemo) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (isDemo && !auth) {
             return NextResponse.json({ lead: { id: 'demo-new-lead', name: 'Mock Lead' } }, { status: 201 })
        }

        if (auth) {
            const roleCheck = checkRole(auth, ['OWNER', 'MANAGER', 'STAFF', 'FRONT_DESK'])
            if (roleCheck) return roleCheck

            const rateLimited = await guardRateLimit(30, `${auth.userId}:leads:post`)
            if (rateLimited) return rateLimited
        }

        let body
        try {
            body = await request.json()
        } catch (e) {
            return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 })
        }
        const validatedData = leadCreateSchema.parse(body)

        const lead = await prisma.lead.create({
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
