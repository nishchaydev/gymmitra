import { prisma } from "./prisma"

/**
 * Generates the next invoice number for a gym
 * Format: {PREFIX}-INV-{COUNTER} (e.g., TF-INV-0001)
 */
export async function generateInvoiceNumber(gymId: string) {
    const gym = await prisma.gymProfile.update({
        where: { id: gymId },
        data: { invoiceCounter: { increment: 1 } },
        select: { invoicePrefix: true, invoiceCounter: true }
    })

    const prefix = gym.invoicePrefix || 'GM'
    const counter = String(gym.invoiceCounter).padStart(4, '0')

    return `${prefix}-INV-${counter}`
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
