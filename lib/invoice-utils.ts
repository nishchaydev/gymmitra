import { Prisma } from "@prisma/client"
import { prisma } from "./prisma"

/**
 * Generates the next invoice number for a gym
 * Format: {PREFIX}-INV-{COUNTER} (e.g., TF-INV-0001)
 * Supports optional transaction client.
 */
export async function generateInvoiceNumber(gymId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma

    try {
        const gym = await client.gymProfile.update({
            where: { id: gymId },
            data: { invoiceCounter: { increment: 1 } },
            select: { invoicePrefix: true, invoiceCounter: true }
        })

        const prefix = gym.invoicePrefix || 'GM'
        const counter = String(gym.invoiceCounter).padStart(4, '0')

        // Safety check for overflow (though unlikely with 4 digits for most gyms)
        if (gym.invoiceCounter > 9999) {
            console.warn(`[INVOICE_COUNTER_WARNING] Gym ${gymId} has exceeded 9999 invoices. Consider adjusting prefix or counter format.`)
        }

        return `${prefix}-INV-${counter}`
    } catch (error) {
        console.error(`Error generating invoice number for gym ${gymId}:`, error)
        // Keep original error context when re-throwing
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
 * Calculates invoice totals
 */
export function calculateInvoiceTotal(items: { quantity: number, unitPrice: number }[], discount: number = 0) {
    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)
    const total = Math.max(0, subtotal - discount)

    return {
        subtotal,
        discount,
        total
    }
}
