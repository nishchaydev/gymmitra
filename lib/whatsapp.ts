/**
 * WhatsApp Utility for GymMitra
 * Generates wa.me links for zero-cost messaging
 */
export const getWhatsAppLink = (phone: string, message: string) => {
    // Remove non-numeric characters, then strip leading 0 (e.g. 06261854014 -> 6261854014)
    const stripped = phone.replace(/\D/g, '')
    const cleanPhone = stripped.startsWith('0') ? stripped.slice(1) : stripped
    // Add country code if missing (assumes India +91)
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
    const encodedMessage = encodeURIComponent(message)
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}

/**
 * Format currency with Indian locale (Rs.)
 * Note: The rupee symbol (₹) can render as "?" on some WhatsApp clients.
 * Using "Rs." is the safest cross-device approach for WhatsApp messages.
 */
const formatCurrency = (amount: number) => {
    return `Rs. ${new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)}`
}

export const templates = {
    /**
     * Sent before membership expiry to prompt renewal.
     */
    renewalReminder: (name: string, daysLeft: number, gymName: string) => {
        return (
            `Dear ${name},\n\n` +
            `This is a courteous reminder from ${gymName}.\n\n` +
            `Your membership is due to expire in *${daysLeft} day${daysLeft === 1 ? '' : 's'}*. ` +
            `We kindly request you to renew your membership at the earliest to ensure uninterrupted access to our facilities.\n\n` +
            `Please visit us at the front desk or contact our team for assistance.\n\n` +
            `Warm regards,\n${gymName}`
        )
    },

    /**
     * Sent upon successful new member registration.
     */
    welcomeMessage: (name: string, gymName: string) => {
        return (
            `Dear ${name},\n\n` +
            `Welcome to *${gymName}*!\n\n` +
            `We are pleased to have you as a member of our fitness community. ` +
            `Your digital membership pass has been activated and is ready for use.\n\n` +
            `Should you have any questions or require assistance, please do not hesitate to reach out to our team.\n\n` +
            `We wish you a rewarding fitness journey ahead.\n\n` +
            `Warm regards,\n${gymName}`
        )
    },

    /**
     * Sent with invoice link after a payment is recorded.
     */
    invoiceShare: (name: string, gymName: string, amount: number, url: string) => {
        const formattedAmount = formatCurrency(amount)
        return (
            `Dear ${name},\n\n` +
            `Thank you for your payment of *${formattedAmount}* to *${gymName}*. ` +
            `Your transaction has been successfully recorded.\n\n` +
            `Please find your official invoice at the link below:\n${url}\n\n` +
            `We appreciate your continued patronage.\n\n` +
            `Warm regards,\n${gymName}`
        )
    },

    /**
     * Sent on the member's birthday.
     */
    birthdayWish: (name: string, gymName: string) => {
        return (
            `Dear ${name},\n\n` +
            `The entire team at *${gymName}* extends our warmest wishes to you on your birthday.\n\n` +
            `We hope this year brings you good health, happiness, and continued progress towards your fitness goals.\n\n` +
            `Warm regards,\n${gymName}`
        )
    },

    /**
     * Sent when a payment is overdue.
     */
    paymentOverdue: (name: string, amount: number, gymName: string) => {
        const formattedAmount = formatCurrency(amount)
        return (
            `Dear ${name},\n\n` +
            `This is a gentle reminder from *${gymName}* that a payment of *${formattedAmount}* is currently outstanding on your membership account.\n\n` +
            `We request you to kindly settle the dues at your earliest convenience to avoid any interruption to your membership.\n\n` +
            `If you have already made the payment, please disregard this message.\n\n` +
            `Warm regards,\n${gymName}`
        )
    },

    /**
     * Sent when a member has not checked in for several days.
     */
    inactivityNudge: (name: string, daysSinceVisit: number, gymName: string) => {
        return (
            `Dear ${name},\n\n` +
            `We noticed that it has been *${daysSinceVisit} day${daysSinceVisit === 1 ? '' : 's'}* since your last visit to *${gymName}*.\n\n` +
            `Consistency is key to achieving your fitness goals, and we would love to see you back. ` +
            `Our team is here to support you every step of the way.\n\n` +
            `We look forward to welcoming you back soon.\n\n` +
            `Warm regards,\n${gymName}`
        )
    },
}

import { getBaseUrl } from './utils'

export const getInvoiceWhatsAppLink = (
    phone: string,
    memberName: string,
    gymName: string,
    amount: number,
    shareToken: string,
    gymSlug: string
): string | null => {
    const baseUrl = getBaseUrl()

    if (!shareToken || typeof shareToken !== 'string' || !shareToken.trim()) {
        console.warn('WhatsApp Link: Invalid or missing shareToken', { shareToken })
        return null
    }

    const safeToken = encodeURIComponent(shareToken.trim())
    const url = `${baseUrl}/${gymSlug}/invoice/${safeToken}`
    const message = templates.invoiceShare(memberName, gymName, amount, url)
    return getWhatsAppLink(phone, message)
}