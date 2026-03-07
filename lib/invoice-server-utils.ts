import { Prisma } from "@prisma/client"
import { prisma } from "./prisma"
import 'server-only'

/**
 * Generates the next invoice number for a gym securely
 * Format: {PREFIX}-INV-{COUNTER} (e.g., TF-INV-0001)
 * Uses a dedicated InvoiceSequence table with atomic upserts to prevent race conditions.
 */
export async function generateInvoiceNumber(gymId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma

    try {
        // Fetch the prefix first (read-only, no locks needed)
        const gym = await client.gymProfile.findUnique({
            where: { id: gymId },
            select: { invoicePrefix: true }
        })

        if (!gym) throw new Error("Gym not found for invoice number generation")

        // Atomic Upsert on dedicated sequence table.
        // This ensures identical increments even under massive concurrent POS load.
        const sequence = await client.invoiceSequence.upsert({
            where: { gymId },
            update: {
                currentValue: { increment: 1 },
                version: { increment: 1 }
            },
            create: {
                gymId,
                currentValue: 1,
                version: 1
            }
        })

        const prefix = gym.invoicePrefix || 'GM'
        const counter = String(sequence.currentValue).padStart(4, '0')

        // Safety check for overflow
        if (sequence.currentValue > 9999) {
            throw new Error(`Invoice counter for gym ${gymId} has exceeded 9999.`);
        }

        return `${prefix}-INV-${counter}`
    } catch (error) {
        console.error(`Error generating invoice number for gym ${gymId}:`, error)
        throw error instanceof Error ? error : new Error("Failed to generate unique invoice number")
    }
}
