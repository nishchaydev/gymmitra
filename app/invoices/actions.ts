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

    // 2. Transactional creation to prevent number collisions
    const invoice = await prisma.$transaction(async (tx) => {
        const invoiceNumber = await generateInvoiceNumber(gym.id, tx)

        const subtotal = validatedData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)
        const total = Math.max(0, subtotal - (validatedData.discount || 0))

        return await tx.invoice.create({
            data: {
                invoiceNumber,
                type: "SALE",
                gymId: gym.id,
                memberId: validatedData.memberId,
                subtotal,
                discount: validatedData.discount,
                total,
                paymentMethod: validatedData.paymentMethod,
                paymentStatus: "PAID",
                notes: validatedData.notes,
                items: {
                    create: validatedData.items.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        amount: item.quantity * item.unitPrice,
                    }))
                }
            }
        })
    })

    revalidatePath("/dashboard")
    revalidatePath("/invoices")

    redirect(`/invoices/${invoice.id}`)
}
