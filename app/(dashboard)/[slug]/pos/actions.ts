'use server'

import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { generateInvoiceNumber } from '@/lib/invoice-server-utils'

export async function processPosSale(slug: string, data: {
    items: { productId: string; quantity: number; unitPrice: number }[]
    paymentMethod: "CASH" | "UPI" | "CARD"
    memberId?: string
    walkInName?: string
    walkInPhone?: string
}) {
    try {
        const auth = await getAuthGym()
        if (!auth) throw new Error("Unauthorized")

        const subtotal = data.items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0)
        const result = await prisma.$transaction(async (tx) => {
            // Generate inside transaction to prevent invoice race conditions
            const invoiceNumber = await generateInvoiceNumber(auth.gym.id, tx)

            // 1. Fetch and validate all products upfront (ownership + stock) before any writes
            const productIds = data.items.map(i => i.productId)
            const products = await tx.product.findMany({
                where: { id: { in: productIds }, gymId: auth.gym.id },
                select: { id: true, name: true, stock: true, gymId: true }
            })

            // Build a lookup map and validate every requested item
            const productMap = new Map(products.map(p => [p.id, p]))
            for (const item of data.items) {
                const product = productMap.get(item.productId)
                if (!product) {
                    throw new Error(`Unauthorized or missing product: ${item.productId}`)
                }
                if (product.stock < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`)
                }
            }

            // 2. Create Invoice with real product names as descriptions
            const invoice = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    gymId: auth.gym.id,
                    memberId: data.memberId || null,
                    walkInName: data.walkInName || null,
                    walkInPhone: data.walkInPhone || null,
                    subtotal,
                    total: subtotal,
                    paymentStatus: 'PAID',
                    paymentMethod: data.paymentMethod,
                    type: 'PRODUCT',
                    items: {
                        create: data.items.map(item => ({
                            description: productMap.get(item.productId)!.name,
                            amount: item.unitPrice * item.quantity,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            gymId: auth.gym.id,
                        }))
                    }
                }
            })

            // 3. Decrement stock for each product atomically
            await Promise.all(
                data.items.map(item =>
                    tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { decrement: item.quantity } }
                    })
                )
            )

            return invoice
        })

        // Revalidate using the safe, exact auth.gym.slug to avoid tampering
        revalidatePath(`/${auth.gym.slug}/pos`)
        revalidatePath(`/${auth.gym.slug}/invoices`)
        revalidatePath(`/${auth.gym.slug}/dashboard`)

        return { success: true, invoiceId: result.id }
    } catch (error: any) {
        console.error("POS Sale Error:", error)
        return { success: false, error: "An internal error occurred while processing the sale." }
    }
}
