import { prisma } from "./prisma"

/**
 * Generates the next invoice number for a gym
 * Format: {PREFIX}-INV-{COUNTER} (e.g., TF-INV-0001)
 * Supports optional transaction client.
 */
export async function generateInvoiceNumber(gymId: string, tx?: any) {
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
            // Log warning or adjust logic if needed. For now, we allow it to grow beyond 4 digits.
        }

        return `${prefix}-INV-${counter}`
    } catch (error) {
        console.error(`Error generating invoice number for gym ${gymId}:`, error)
        throw new Error("Failed to generate unique invoice number")
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
