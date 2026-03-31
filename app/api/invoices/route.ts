import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { apiLimiter } from '@/lib/rate-limit'

// Validations
const invoiceItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
})

const invoiceCreateSchema = z.object({
    memberId: z.string().optional(), // Optional for walk-ins
    type: z.enum(['MEMBERSHIP', 'SALE', 'RENEWAL']),
    paymentStatus: z.enum(['PAID', 'PENDING', 'OVERDUE', 'PARTIAL']).default('PENDING'),
    paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'OTHER']).optional(),
    items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
    notes: z.string().optional(),
    dueDate: z.string().optional().transform(str => str ? new Date(str) : undefined),
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

        return NextResponse.json({ invoices, totalCount, page, hasMore: totalCount > page * take })
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

        // Calculate totals
        const subtotal = validatedData.items.reduce((acc, item) => {
            return acc + (item.quantity * item.unitPrice)
        }, 0)

        // Tax applied AFTER discount — matches BillingService convention
        const afterDiscount = Math.max(0, subtotal - validatedData.discount)
        const total = Math.round((afterDiscount + validatedData.taxAmount) * 100) / 100

        const amountPaid = validatedData.paymentStatus === 'PARTIAL'
            ? Math.min(validatedData.amountPaid ?? 0, total)
            : validatedData.paymentStatus === 'PENDING'
                ? 0
                : total

        const balanceDue = validatedData.paymentStatus === 'PARTIAL'
            ? Math.max(0, total - Math.min(validatedData.amountPaid ?? 0, total))
            : validatedData.paymentStatus === 'PENDING'
                ? total
                : 0

        // Generate Invoice Number
        const { BillingRepository } = await import("@/src/modules/billing/repository")
        const invoiceNumber = await BillingRepository.generateInvoiceNumber(gym.id)

        const crypto = await import('crypto')
        const shareToken = crypto.randomBytes(32).toString('hex')
        const expiryDays = Math.max(0, gym.invoiceLinkExpiryDays ?? 30)
        const shareTokenExpiresAt = expiryDays > 0
            ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
            : null // 0 = never expire

        try {
            const invoice = await prisma.invoice.create({
                data: {
                    invoiceNumber,
                    type: validatedData.type,
                    gymId: gym.id,
                    memberId: validatedData.memberId,
                    paymentStatus: validatedData.paymentStatus,
                    paymentMethod: validatedData.paymentMethod,
                    notes: validatedData.notes,
                    dueDate: validatedData.dueDate,
                    subtotal: subtotal,
                    taxAmount: validatedData.taxAmount,
                    discount: validatedData.discount,
                    total: total,
                    amountPaid: amountPaid as any,
                    balanceDue: balanceDue as any,
                    idempotencyKey: validatedData.idempotencyKey,
                    shareToken: shareToken,
                    shareTokenExpiresAt: shareTokenExpiresAt,
                    items: {
                        create: validatedData.items.map(item => ({
                            description: item.description,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            amount: item.quantity * item.unitPrice,
                            gymId: gym.id, // Mandatory for multi-tenancy
                        }))
                    }
                } as any,
                include: {
                    items: true
                }
            })

            return NextResponse.json(invoice, { status: 201 })
        } catch (createErr: any) {
            if (createErr.code === 'P2002' && validatedData.idempotencyKey) {
                // Ensure the collision was actually on idempotencyKey before returning success
                if (createErr.meta?.target?.includes('idempotencyKey')) {
                    const existingInvoice = await prisma.invoice.findFirst({
                        where: {
                            idempotencyKey: validatedData.idempotencyKey,
                            gymId: gym.id
                        },
                        include: { items: true }
                    })
                    if (existingInvoice) {
                        return NextResponse.json(existingInvoice, { status: 200 })
                    }
                }
            }
            throw createErr
        }
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
