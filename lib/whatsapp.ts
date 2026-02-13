/**
 * WhatsApp Utility for GymMitra
 * Generates wa.me links for zero-cost messaging
 */

export const getWhatsAppLink = (phone: string, message: string) => {
    // Remove non-numeric characters from phone
    const cleanPhone = phone.replace(/\D/g, '')

    // Add country code if missing (assumes India +91)
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone

    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}

export const templates = {
    renewalReminder: (name: string, daysLeft: number, gymName: string) => {
        return `Hello ${name}, this is a reminder from ${gymName}. Your membership expires in ${daysLeft} days. Kindly renew to continue your fitness journey! 💪`
    },
    welcomeMessage: (name: string, gymName: string) => {
        return `Welcome to ${gymName}, ${name}! We're excited to have you with us. Your digital membership pass is ready.`
    },
    invoiceShare: (name: string, gymName: string, amount: number, url: string) => {
        return `Hello ${name}! 👋\n\nThank you for your payment of ₹${amount} to ${gymName}.\n\nView your official invoice here:\n${url}\n\nThank you for choosing us! 💪`
    }
}

export const getInvoiceWhatsAppLink = (
    phone: string,
    memberName: string,
    gymName: string,
    amount: number,
    shareToken: string
) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    const url = `${baseUrl}/invoice/${shareToken}`
    const message = templates.invoiceShare(memberName, gymName, amount, url)
    return getWhatsAppLink(phone, message)
}
