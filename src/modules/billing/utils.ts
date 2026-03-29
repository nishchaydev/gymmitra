/**
 * Generates UPI Deep Link data
 */
export function generateUpiQrData(upiId: string, amount: number, name: string, invoiceNumber: string) {
    const amountStr = amount.toFixed(2)
    // URL encode parameters properly to ensure valid UPI string
    const encodedName = encodeURIComponent(name)
    const encodedTr = encodeURIComponent(invoiceNumber)
    
    // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tr=TXN_ID
    return `upi://pay?pa=${upiId}&pn=${encodedName}&am=${amountStr}&cu=INR&tr=${encodedTr}`
}
