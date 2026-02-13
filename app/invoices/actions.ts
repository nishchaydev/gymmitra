'use server'

import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { generateInvoiceNumber } from "@/lib/invoice-utils"
import { z } from "zod"

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

export async function createInvoice(data: z.infer<typeof createInvoiceSchema>) {
    // 1. Runtime Validation
    const validatedData = createInvoiceSchema.parse(data)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    const gym = await prisma.gymProfile.findUnique({
        where: { userId: user.id }
    })

    if (!gym) throw new Error("Gym not found")

    try {
        const invoice = await prisma.$transaction(async (tx) => {
            const invoiceNumber = await generateInvoiceNumber(gym.id, tx)

            // Use integer arithmetic (cents) for precision
            const subtotalCents = validatedData.items.reduce((acc, item) =>
                acc + Math.round(item.quantity * (item.unitPrice * 100)), 0)

            const discountCents = Math.round(validatedData.discount * 100)
            const totalCents = Math.max(0, subtotalCents - discountCents)

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
}
