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
