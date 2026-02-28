import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { getAuthGym } from '@/lib/auth'
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

        // Validate status if provided
        const allowedStatuses = ["PAID", "PENDING", "OVERDUE", "PARTIAL"]

        if (status && !allowedStatuses.includes(status.toUpperCase())) {
            return NextResponse.json(
                { error: `Invalid status. Must be one of: ${allowedStatuses.join(", ")}` },
                { status: 400 }
            )
        }

        const validatedStatus = status ? (status.toUpperCase() as "PAID" | "PENDING" | "OVERDUE" | "PARTIAL") : undefined

        const invoices = await prisma.invoice.findMany({
            where: {
                gymId: gym.id,
                ...(memberId ? { memberId } : {}),
                ...(validatedStatus ? { paymentStatus: validatedStatus } : {}),
            },
            include: {
                member: {
                    select: { name: true, email: true }
                },
                items: true
            },
            orderBy: { issueDate: 'desc' }
        })

        return NextResponse.json(invoices)
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

        const total = Math.max(0, subtotal + validatedData.taxAmount - validatedData.discount)

        // Generate Invoice Number
        const { generateInvoiceNumber } = await import("@/lib/invoice-utils")
        const invoiceNumber = await generateInvoiceNumber(gym.id)

        const crypto = await import('crypto')
        const shareToken = crypto.randomBytes(32).toString('hex')
        const shareTokenExpiresAt = new Date()
        shareTokenExpiresAt.setDate(shareTokenExpiresAt.getDate() + 30)

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
                },
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
