import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { apiLimiter } from '@/lib/rate-limit'
import { BillingService } from '@/src/modules/billing/service'
import { optionalDateField } from '@/lib/date-validation'
import { getCached, setCached, invalidateCache, cacheKey, CACHE_TTL } from "@/lib/redis-cache"

// Validations
const invoiceItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
})

const invoiceCreateSchema = z.object({
    memberId: z.string().optional(), // Optional for walk-ins
    walkInName: z.string().optional(),
    walkInPhone: z.string().optional(),
    walkInEmail: z.string().optional(),
    walkInAddress: z.string().optional(),
    type: z.enum(['MEMBERSHIP', 'SALE', 'RENEWAL', 'PRODUCT']).default('SALE'),
    paymentStatus: z.enum(['PAID', 'PENDING', 'OVERDUE', 'PARTIAL']).default('PENDING'),
    paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'OTHER']).optional(),
    items: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        type: z.enum(['MEMBERSHIP', 'PRODUCT', 'OTHER']).default('OTHER'),
        productId: z.string().optional(),
    })).min(1, "At least one item is required"),
    notes: z.string().optional(),
    dueDate: optionalDateField('dueDate'),
    issueDate: optionalDateField('issueDate'),
    discount: z.number().nonnegative().optional().default(0),
    taxAmount: z.number().nonnegative().optional().default(0),
    idempotencyKey: z.string().optional(),
    amountPaid: z.number().nonnegative().optional().default(0),
})

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthGym()

        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Rate limit: 100 requests per minute per user
        try {
            await apiLimiter.check(100, auth.userId)
        } catch (error) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        }

        const gym = auth.gym

        // Only STAFF-level and above can list invoices; TRAINER has no need for billing data
        const roleCheck = checkRole(auth, ['OWNER', 'MANAGER', 'STAFF', 'FRONT_DESK'])
        if (roleCheck) return roleCheck

        const { searchParams } = new URL(request.url)
        const memberId = searchParams.get('memberId')
        const status = searchParams.get('status')
        const q = searchParams.get('q') || ''
        const parsedPage = parseInt(searchParams.get('page') || '1', 10)
        const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage)
        const parsedTake = parseInt(searchParams.get('take') || '50', 10)
        const take = Math.min(100, Math.max(1, isNaN(parsedTake) ? 50 : parsedTake))
        const skip = (page - 1) * take

        // Validate status if provided
        const allowedStatuses = ["PAID", "PENDING", "OVERDUE", "PARTIAL", "ALL"]

        let validatedStatus: "PAID" | "PENDING" | "OVERDUE" | "PARTIAL" | undefined = undefined

        if (status && status !== 'ALL') {
            if (!allowedStatuses.includes(status.toUpperCase())) {
                return NextResponse.json(
                    { error: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}` },
                    { status: 400 }
                )
            }
            validatedStatus = status.toUpperCase() as "PAID" | "PENDING" | "OVERDUE" | "PARTIAL"
        }

        const whereClause: any = {
            gymId: gym.id,
            deletedAt: null,
            ...(validatedStatus ? { paymentStatus: validatedStatus } : {}),
            ...(q
                ? {
                    OR: [
                        { invoiceNumber: { contains: q, mode: 'insensitive' } },
                        { walkInName: { contains: q, mode: 'insensitive' } },
                        { member: { name: { contains: q, mode: 'insensitive' } } },
                        { member: { phone: { contains: q } } }
                    ],
                }
                : {}),
        }

        // IDOR guard: validate memberId belongs to this gym before filtering
        if (memberId) {
            const memberBelongsToGym = await prisma.member.findFirst({
                where: { id: memberId, gymId: gym.id },
                select: { id: true }
            })
            if (!memberBelongsToGym) {
                return NextResponse.json({ error: 'Member not found' }, { status: 404 })
            }
            whereClause.memberId = memberId
        }

        // ── Redis-First cache check ──────────────────────────────────────────
        const isCacheable = !q && !memberId
        if (isCacheable) {
            const paramsKey = `${validatedStatus || 'ALL'}:p${page}:t${take}`
            const redisKey = cacheKey.invoicesList(gym.id, paramsKey)
            const cached = await getCached<object>(redisKey)
            if (cached) {
                return NextResponse.json(cached, {
                    headers: {
                        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
                        'X-Cache': 'HIT',
                    },
                })
            }
        }

        const [invoices, totalCount] = await Promise.all([
            prisma.invoice.findMany({
                where: whereClause,
                include: {
                    member: {
                        select: { name: true, phone: true }
                    },
                    items: true
                },
                orderBy: { issueDate: 'desc' },
                take,
                skip,
            }),
            prisma.invoice.count({ where: whereClause })
        ])

        const responseBody = { invoices, totalCount, page, hasMore: totalCount > page * take }

        if (isCacheable) {
            const paramsKey = `${validatedStatus || 'ALL'}:p${page}:t${take}`
            const redisKey = cacheKey.invoicesList(gym.id, paramsKey)
            setCached(redisKey, responseBody, CACHE_TTL.INVOICES_LIST).catch(() => {})
        }

        return NextResponse.json(responseBody, {
            headers: {
                'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
                'X-Cache': 'MISS',
            },
        })
    } catch (error) {
        console.error('Error fetching invoices:', error)
        return NextResponse.json(
            { error: 'Failed to fetch invoices' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthGym()

        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Rate limit: 20 creations per minute per user
        try {
            await apiLimiter.check(20, auth.userId)
        } catch (error) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        }

        const gym = auth.gym

        // STAFF and above can create invoices
        const roleCheck = checkRole(auth, ['OWNER', 'MANAGER', 'STAFF', 'FRONT_DESK'])
        if (roleCheck) return roleCheck

        let body;
        try {
            body = await request.json()
        } catch (e) {
            return NextResponse.json({ error: 'Malformed JSON payload' }, { status: 400 })
        }
        const validatedData = invoiceCreateSchema.parse(body)

        // IDOR check: verify member belongs to this gym
        if (validatedData.memberId) {
            const memberExists = await prisma.member.findFirst({
                where: { id: validatedData.memberId, gymId: gym.id }
            })
            if (!memberExists) {
                return NextResponse.json({ error: 'Unauthorized: Member does not belong to this gym' }, { status: 403 })
            }
        }

        const ipHeader = request.headers.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

        const result = await BillingService.createInvoice(
            gym,
            validatedData as any,
            auth.userId,
            ip
        )

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 400 })
        }

        // Write-through: bust cache for invoices
        await invalidateCache(
            cacheKey.invoicesList(gym.id, 'ALL:p1:t50'),
            cacheKey.invoicesList(gym.id, 'PENDING:p1:t50'),
            cacheKey.invoicesList(gym.id, 'PAID:p1:t50')
        ).catch(() => {})

        const invoice = await prisma.invoice.findUnique({
            where: { id: result.id },
            include: { items: true }
        })

        return NextResponse.json(invoice, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.issues },
                { status: 400 }
            )
        }
        console.error('Error creating invoice:', error)
        return NextResponse.json(
            { error: 'Failed to create invoice' },
            { status: 500 }
        )
    }
}
