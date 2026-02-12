import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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
    tax: z.number().nonnegative().optional().default(0),
})

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const memberId = searchParams.get('memberId')
        const status = searchParams.get('status')

        const invoices = await prisma.invoice.findMany({
            where: {
                ...(memberId ? { memberId } : {}),
                ...(status ? { paymentStatus: status as any } : {}),
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
        const body = await request.json()
        const validatedData = invoiceCreateSchema.parse(body)

        // Calculate totals
        const subtotal = validatedData.items.reduce((acc, item) => {
            return acc + (item.quantity * item.unitPrice)
        }, 0)

        const total = subtotal + validatedData.tax - validatedData.discount

        // Generate Invoice Number (Simple format: INV-TIMESTAMP-RANDOM)
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                type: validatedData.type as any,
                memberId: validatedData.memberId,
                paymentStatus: validatedData.paymentStatus as any,
                paymentMethod: validatedData.paymentMethod as any,
                notes: validatedData.notes,
                dueDate: validatedData.dueDate,
                subtotal: subtotal,
                tax: validatedData.tax,
                discount: validatedData.discount,
                total: total,
                items: {
                    create: validatedData.items.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        amount: item.quantity * item.unitPrice
                    }))
                }
            },
            include: {
                items: true
            }
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
