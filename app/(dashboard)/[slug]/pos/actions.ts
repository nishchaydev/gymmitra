'use server'

import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { BillingRepository } from '@/src/modules/billing/repository'

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

        // Subtotal calculated below using DB prices, not client prices
        const result = await prisma.$transaction(async (tx) => {
            // Generate inside transaction to prevent invoice race conditions
            const invoiceNumber = await BillingRepository.generateInvoiceNumber(auth.gym.id, tx)

            // IDOR check: verify member belongs to this gym
            if (data.memberId) {
                const member = await tx.member.findFirst({
                    where: { id: data.memberId, gymId: auth.gym.id }
                })
                if (!member) {
                    throw new Error("Unauthorized or invalid member for this gym.")
                }
            }

            // 1. Fetch and validate all products upfront (ownership + stock) before any writes
            const productIds = data.items.map(i => i.productId)
            const products = await tx.product.findMany({
                where: { id: { in: productIds }, gymId: auth.gym.id },
                select: { id: true, name: true, stock: true, price: true, gymId: true }
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

            // Calculate subtotal using DB prices (never trust client unitPrice)
            const trustedSubtotal = data.items.reduce((acc, item) => {
                const product = productMap.get(item.productId)!
                return acc + (Number(product.price) * item.quantity)
            }, 0)

            // 2. Create Invoice with real product names as descriptions
            const invoice = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    gymId: auth.gym.id,
                    memberId: data.memberId || null,
                    walkInName: data.walkInName || null,
                    walkInPhone: data.walkInPhone || null,
                    subtotal: trustedSubtotal,
                    total: trustedSubtotal,
                    paymentStatus: 'PAID',
                    paymentMethod: data.paymentMethod,
                    type: 'PRODUCT',
                    items: {
                        create: data.items.map(item => {
                            const product = productMap.get(item.productId)!
                            const dbPrice = Number(product.price)
                            return {
                                description: product.name,
                                amount: dbPrice * item.quantity,
                                quantity: item.quantity,
                                unitPrice: dbPrice,
                                gymId: auth.gym.id,
                            }
                        })
                    }
                }
            })

            // 3. Decrement stock for each product atomically — guard against going negative
            for (const item of data.items) {
                const result = await tx.product.updateMany({
                    where: { id: item.productId, stock: { gte: item.quantity } },
                    data: { stock: { decrement: item.quantity } }
                })
                if (result.count === 0) {
                    const product = productMap.get(item.productId)!
                    throw new Error(`Insufficient stock for ${product.name}. Another sale may have just completed.`)
                }
            }

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
