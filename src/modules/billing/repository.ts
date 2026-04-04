import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

export class BillingRepository {
    /**
     * Run a callback inside a Prisma transaction.
     */
    static async executeTransaction<T>(
        callback: (tx: Prisma.TransactionClient) => Promise<T>,
        options?: { isolationLevel?: Prisma.TransactionIsolationLevel }
    ): Promise<T> {
        return prisma.$transaction(callback, options)
    }

    /**
     * Generates a unique, sequential invoice number for a given gym.
     * Uses atomic SQL to increment and return in one operation — no race conditions.
     */
    static async generateInvoiceNumber(gymId: string, tx?: Prisma.TransactionClient): Promise<string> {
        const client = tx || prisma

        // 1. Fetch prefix (read-only, no locks needed)
        const gym = await client.gymProfile.findUnique({
            where: { id: gymId },
            select: { invoicePrefix: true }
        })

        if (!gym) throw new Error("Gym not found for invoice number generation")

        // 2. Atomic increment — single SQL statement prevents race conditions
        const result = await client.$queryRaw<[{ next_val: number }]>`
            INSERT INTO "InvoiceSequence" ("id", "gymId", "currentValue", "version", "updatedAt")
            VALUES (gen_random_uuid(), ${gymId}, 1, 1, now())
            ON CONFLICT ("gymId") DO UPDATE
                SET "currentValue" = "InvoiceSequence"."currentValue" + 1,
                    "version" = "InvoiceSequence"."version" + 1,
                    "updatedAt" = now()
            RETURNING "currentValue" AS next_val
        `

        const nextValue = Number(result[0].next_val)

        if (nextValue > 99999) {
            throw new Error(`Invoice counter for gym ${gymId} has exceeded 99999. Contact support.`)
        }

        const prefix = gym.invoicePrefix || 'GM'
        const counter = String(nextValue).padStart(5, '0')

        return `${prefix}-INV-${counter}`
    }

    /**
     * Create an invoice inside a transaction.
     * Encapsulates the full invoice + items creation.
     */
    static async createInvoiceInTransaction(
        data: {
            invoiceNumber: string
            type: string
            gymId: string
            memberId?: string | null
            subscriptionId?: string | null
            subtotal: number
            taxAmount: number
            taxPercentage: number
            discount: number
            total: number
            amountPaid: number
            balanceDue: number
            paymentStatus: string
            paymentMethod?: string | null
            idempotencyKey?: string | null
            walkInName?: string | null
            walkInPhone?: string | null
            walkInEmail?: string | null
            walkInAddress?: string | null
            notes?: string | null
            shareToken: string
            shareTokenExpiresAt: Date | null
            issueDate?: Date
            dueDate?: Date | null
            items: Array<{
                description: string
                quantity: number
                unitPrice: number
                taxPercentage?: number
                taxAmount?: number
                amount: number
                gymId: string
            }>
        },
        tx: Prisma.TransactionClient
    ) {
        return tx.invoice.create({
            data: {
                invoiceNumber: data.invoiceNumber,
                type: data.type as any,
                gymId: data.gymId,
                memberId: data.memberId || null,
                subscriptionId: data.subscriptionId || null,
                subtotal: data.subtotal,
                taxAmount: data.taxAmount,
                taxPercentage: data.taxPercentage,
                discount: data.discount,
                total: data.total,
                amountPaid: data.amountPaid as any,
                balanceDue: data.balanceDue as any,
                paymentStatus: data.paymentStatus as any,
                paymentMethod: data.paymentMethod as any,
                idempotencyKey: data.idempotencyKey ?? null,
                walkInName: data.walkInName ?? null,
                walkInPhone: data.walkInPhone ?? null,
                walkInEmail: data.walkInEmail ?? null,
                walkInAddress: data.walkInAddress ?? null,
                notes: data.notes ?? null,
                shareToken: data.shareToken,
                shareTokenExpiresAt: data.shareTokenExpiresAt,
                issueDate: data.issueDate ?? new Date(),
                dueDate: data.dueDate ?? null,
                items: {
                    create: data.items.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        taxPercentage: item.taxPercentage ?? 0,
                        taxAmount: item.taxAmount ?? 0,
                        amount: item.amount,
                        gymId: item.gymId,
                    }))
                }
            },
            include: { items: true }
        })
    }

    /**
     * Find an invoice with its share token and gym slug.
     * Used for generating public invoice URLs.
     */
    static async findInvoiceWithToken(invoiceId: string, tx?: Prisma.TransactionClient) {
        const client = tx || prisma
        return client.invoice.findUnique({
            where: { id: invoiceId },
            select: { shareToken: true, gym: { select: { slug: true } } }
        })
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
