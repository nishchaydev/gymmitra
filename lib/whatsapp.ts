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

/**
 * Format currency with Indian locale (₹)
 */
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)
}

export const templates = {
    renewalReminder: (name: string, daysLeft: number, gymName: string) => {
        return `Hello ${name}, this is a reminder from ${gymName}. Your membership expires in ${daysLeft} days. Kindly renew to continue your fitness journey! 💪`
    },
    welcomeMessage: (name: string, gymName: string) => {
        return `Welcome to ${gymName}, ${name}! We're excited to have you with us. Your digital membership pass is ready.`
    },
    invoiceShare: (name: string, gymName: string, amount: number, url: string) => {
        const formattedAmount = formatCurrency(amount)
        return `Hello ${name}! 👋\n\nThank you for your payment of ${formattedAmount} to ${gymName}.\n\nView your official invoice here:\n${url}\n\nThank you for choosing us! 💪`
    },
    birthdayWish: (name: string, gymName: string) => {
        return `🎂 Happy Birthday, ${name}! The entire team at ${gymName} wishes you a wonderful year ahead. Keep crushing your fitness goals! 💪🎉`
    },
    paymentOverdue: (name: string, amount: number, gymName: string) => {
        const formattedAmount = formatCurrency(amount)
        return `Hello ${name}, a gentle reminder that a payment of ${formattedAmount} is overdue for your membership at ${gymName}. Please clear it at your earliest convenience to avoid any interruption. Thank you! 🙏`
    },
    inactivityNudge: (name: string, daysSinceVisit: number, gymName: string) => {
        return `Hey ${name}! 👋 We miss you at ${gymName}! It's been ${daysSinceVisit} days since your last visit. Come back and keep your fitness streak alive — your goals are waiting! 💪`
    }
}

export const getInvoiceWhatsAppLink = (
    phone: string,
    memberName: string,
    gymName: string,
    amount: number,
    shareToken: string
) => {
    // Normalize baseUrl: trim trailing slash to prevent double-slashes
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://gymmitra.com'
    const baseUrl = siteUrl.replace(/\/$/, '')

    if (!baseUrl || baseUrl === 'https://gymmitra.com' && process.env.NODE_ENV === 'development') {
        console.warn('⚠️ WhatsApp Link: Base URL not configured properly. Using fallback.', { siteUrl })
    }

    const url = `${baseUrl}/invoice/${shareToken}`
    const message = templates.invoiceShare(memberName, gymName, amount, url)
    return getWhatsAppLink(phone, message)
}
