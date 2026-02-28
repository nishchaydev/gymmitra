'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { generateInvoiceNumber } from "@/lib/invoice-utils"
import { z } from "zod"
import { withAuth } from "@/lib/with-auth"
import { recordAuditLog } from "@/lib/audit-logger"
import { headers } from 'next/headers'

const invoiceItemSchema = z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    type: z.enum(["MEMBERSHIP", "PRODUCT", "OTHER"]),
})

const createInvoiceSchema = z.object({
    memberId: z.string().optional(),
    walkInName: z.string().optional(),
    walkInPhone: z.string().optional(),
    walkInEmail: z.string().optional(),
    walkInAddress: z.string().optional(),
    paymentMethod: z.enum(["CASH", "UPI"]),
    notes: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1),
    discount: z.number().min(0).default(0),
    idempotencyKey: z.string().optional(),
})

// Secure Server Action wrapped in withAuth
export const createInvoice = withAuth(async (context, data: z.infer<typeof createInvoiceSchema>) => {
    // 1. Runtime Validation
    const validatedData = createInvoiceSchema.parse(data)

    // 2. Strict Tenant Context derived server-side
    const gym = context.gym

    // 3. Idempotency Check
    if (validatedData.idempotencyKey) {
        const existingInvoice = await prisma.invoice.findFirst({
            where: {
                idempotencyKey: validatedData.idempotencyKey,
                gymId: gym.id
            }
        })
        if (existingInvoice) {
            return { success: true, id: existingInvoice.id }
        }
    }

    try {
        const invoice = await prisma.$transaction(async (tx) => {
            const invoiceNumber = await generateInvoiceNumber(gym.id, tx)
            const taxPercentage = Number((gym as any).taxPercentage || 18)

            // Use integer arithmetic (cents) for precision
            const subtotalCents = validatedData.items.reduce((acc, item) =>
                acc + Math.round(item.quantity * (item.unitPrice * 100)), 0)

            const discountCents = Math.round(validatedData.discount * 100)
            const subtotalAfterDiscountCents = Math.max(0, subtotalCents - discountCents)

            // Calculate Tax (Applied on the discounted subtotal)
            const taxAmountCents = Math.round((subtotalAfterDiscountCents * taxPercentage) / 100)
            const totalCents = subtotalAfterDiscountCents + taxAmountCents

            const crypto = await import('crypto')
            const shareToken = crypto.randomBytes(32).toString('hex')
            const shareTokenExpiresAt = new Date()
            shareTokenExpiresAt.setDate(shareTokenExpiresAt.getDate() + 30)

            return await (tx.invoice as any).create({
                data: {
                    invoiceNumber,
                    type: "SALE",
                    gym: { connect: { id: gym.id } },
                    member: validatedData.memberId ? { connect: { id: validatedData.memberId } } : undefined,
                    subtotal: subtotalCents / 100,
                    taxAmount: taxAmountCents / 100,
                    discount: validatedData.discount,
                    total: totalCents / 100,
                    idempotencyKey: validatedData.idempotencyKey,
                    walkInName: validatedData.walkInName || null,
                    walkInPhone: validatedData.walkInPhone || null,
                    walkInEmail: validatedData.walkInEmail || null,
                    walkInAddress: validatedData.walkInAddress || null,
                    paymentMethod: validatedData.paymentMethod,
                    paymentStatus: "PAID",
                    notes: validatedData.notes ?? null,
                    shareToken: shareToken,
                    shareTokenExpiresAt: shareTokenExpiresAt,
                    items: {
                        create: validatedData.items.map(item => {
                            const itemAmountCents = Math.round(item.quantity * (item.unitPrice * 100))
                            // Calculate item-level tax proportionally (optional but good for ERP)
                            const proportionality = subtotalCents > 0 ? (itemAmountCents / subtotalCents) : 0
                            const itemTaxAmountCents = Math.round(taxAmountCents * proportionality)

                            return {
                                description: item.description,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                taxAmount: itemTaxAmountCents / 100,
                                amount: itemAmountCents / 100,
                                gymId: gym.id
                            }
                        })
                    }
                }
            })
        })

        revalidatePath("/dashboard")
        revalidatePath("/invoices")

        // 4. Audit Log
        const headerList = await headers()
        const ip = headerList.get('x-forwarded-for') || '127.0.0.1'
        recordAuditLog({
            gymId: gym.id,
            actorId: context.userId,
            action: 'CREATE_INVOICE',
            entityType: 'INVOICE',
            entityId: invoice.id,
            ipAddress: ip,
            payload: { invoiceNumber: invoice.invoiceNumber, total: invoice.total }
        })

        return { success: true, id: invoice.id }
    } catch (error) {
        console.error("Invoice Action Error:", error)
        return { error: error instanceof Error ? error.message : "Failed to create invoice" }
    }
}, ['OWNER', 'STAFF']) // Only Owners and Staff can create invoices
