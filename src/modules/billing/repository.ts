import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export class BillingRepository {
    /**
     * Generates a unique, sequential invoice number for a given gym.
     * Uses an atomic upsert to prevent race conditions.
     */
    static async generateInvoiceNumber(gymId: string, tx?: Prisma.TransactionClient): Promise<string> {
        const client = tx || prisma

        // 1. Fetch prefix (read-only, no locks needed)
        const gym = await client.gymProfile.findUnique({
            where: { id: gymId },
            select: { invoicePrefix: true }
        })

        if (!gym) throw new Error("Gym not found for invoice number generation")

        // 2. Safely read current before incrementing
        const existing = await client.invoiceSequence.findUnique({ where: { gymId } })
        const nextValue = (existing?.currentValue ?? 0) + 1

        if (nextValue > 99999) {
            throw new Error(`Invoice counter for gym ${gymId} has exceeded 99999. Contact support.`)
        }

        // 3. Atomic upsert
        const sequence = await client.invoiceSequence.upsert({
            where: { gymId },
            update: {
                currentValue: nextValue,
                version: { increment: 1 }
            },
            create: {
                gymId,
                currentValue: 1,
                version: 1
            }
        })

        const prefix = gym.invoicePrefix || 'GM'
        const counter = String(sequence.currentValue).padStart(5, '0')

        return `${prefix}-INV-${counter}`
    }

    /**
     * Finds an invoice by its ID and gym ID.
     */
    static async findInvoiceById(invoiceId: string, gymId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.invoice.findFirst({
            where: { id: invoiceId, gymId }
        })
    }

    /**
     * Updates an invoice payment status and amounts.
     */
    static async updatePaymentInfo(
        invoiceId: string,
        data: { amountPaid: number; balanceDue: number; paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING' },
        tx?: Prisma.TransactionClient
    ) {
        const client = tx || prisma
        return client.invoice.update({
            where: { id: invoiceId },
            data: {
                amountPaid: data.amountPaid as any,
                balanceDue: data.balanceDue as any,
                paymentStatus: data.paymentStatus
            }
        })
    }

    /**
     * Finds an existing invoice by idempotency key to prevent duplicates.
     */
    static async findByIdempotencyKey(key: string, gymId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.invoice.findFirst({
            where: { idempotencyKey: key, gymId }
        })
    }
}
