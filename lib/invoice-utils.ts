import { Prisma } from "@prisma/client"
import { prisma } from "./prisma"

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
            console.warn(`[INVOICE_COUNTER_WARNING] Gym ${gymId} has exceeded 9999 invoices.`)
        }

        return `${prefix}-INV-${counter}`
    } catch (error) {
        console.error(`Error generating invoice number for gym ${gymId}:`, error)
        throw error instanceof Error ? error : new Error("Failed to generate unique invoice number")
    }
}

/**
 * Generates UPI Deep Link data
 */
export function generateUpiQrData(upiId: string, amount: number, name: string, invoiceNumber: string) {
    // If it's just a 10-digit number, assume @upi (common default)
    const vpa = /^\d{10}$/.test(upiId) ? `${upiId}@upi` : upiId

    // Standard UPI deep link format
    const baseUrl = "upi://pay"
    const params = new URLSearchParams({
        pa: vpa,
        pn: name,
        am: amount.toString(),
        cu: "INR",
        tn: `Invoice ${invoiceNumber}`,
    })

    return `${baseUrl}?${params.toString()}`
}

/**
 * Calculates invoice totals with GST
 */
export function calculateInvoiceTotal(
    items: { quantity: number, unitPrice: number }[],
    discount: number = 0,
    taxPercentage: number = 18
) {
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)
    const subtotalAfterDiscount = Math.max(0, subtotal - discount)

    // GST Calculation: Tax is applied on the discounted subtotal
    const taxAmountRaw = (subtotalAfterDiscount * Number(taxPercentage)) / 100
    const totalRaw = subtotalAfterDiscount + taxAmountRaw

    const taxAmount = Math.round(taxAmountRaw * 100) / 100
    const total = Math.round(totalRaw * 100) / 100

    return {
        subtotal,
        discount,
        taxAmount,
        total
    }
}
