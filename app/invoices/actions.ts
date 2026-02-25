'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { generateInvoiceNumber } from "@/lib/invoice-utils"
import { z } from "zod"
import { withAuth } from "@/lib/with-auth"

const invoiceItemSchema = z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    type: z.enum(["MEMBERSHIP", "PRODUCT", "OTHER"]),
})

const createInvoiceSchema = z.object({
    memberId: z.string().optional(),
    paymentMethod: z.enum(["CASH", "UPI"]),
    notes: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1),
    discount: z.number().min(0).default(0),
})

// Secure Server Action wrapped in withAuth
export const createInvoice = withAuth(async (context, data: z.infer<typeof createInvoiceSchema>) => {
    // 1. Runtime Validation
    const validatedData = createInvoiceSchema.parse(data)

    // 2. Strict Tenant Context derived server-side
    const gym = context.gym

    try {
        const invoice = await prisma.$transaction(async (tx) => {
            const invoiceNumber = await generateInvoiceNumber(gym.id, tx)

            // Use integer arithmetic (cents) for precision
            const subtotalCents = validatedData.items.reduce((acc, item) =>
                acc + Math.round(item.quantity * (item.unitPrice * 100)), 0)

            const discountCents = Math.round(validatedData.discount * 100)
            const totalCents = Math.max(0, subtotalCents - discountCents)

            const crypto = await import('crypto')
            const shareToken = crypto.randomBytes(32).toString('hex')
            const shareTokenExpiresAt = new Date()
            shareTokenExpiresAt.setDate(shareTokenExpiresAt.getDate() + 30)

            return await tx.invoice.create({
                data: {
                    invoiceNumber,
                    type: "SALE",
                    gym: { connect: { id: gym.id } },
                    member: validatedData.memberId ? { connect: { id: validatedData.memberId } } : undefined,
                    subtotal: subtotalCents / 100,
                    discount: validatedData.discount,
                    total: totalCents / 100,
                    paymentMethod: validatedData.paymentMethod,
                    paymentStatus: "PAID",
                    notes: validatedData.notes ?? null,
                    shareToken: shareToken,
                    shareTokenExpiresAt: shareTokenExpiresAt,
                    items: {
                        create: validatedData.items.map(item => {
                            const itemAmountCents = Math.round(item.quantity * (item.unitPrice * 100))
                            return {
                                description: item.description,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                amount: itemAmountCents / 100,
                                gymId: gym.id // Crucial for multi-tenant isolation
                            }
                        })
                    }
                }
            })
        })

        revalidatePath("/dashboard")
        revalidatePath("/invoices")

        return { success: true, id: invoice.id }
    } catch (error) {
        console.error("Invoice Action Error:", error)
        return { error: error instanceof Error ? error.message : "Failed to create invoice" }
    }
}, ['OWNER', 'STAFF']) // Only Owners and Staff can create invoices
