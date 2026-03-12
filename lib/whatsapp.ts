import { getBaseUrl } from './utils'

/**
 * WhatsApp Utility for GymMitra
 * Generates wa.me links for zero-cost messaging
 */
export const getWhatsAppLink = (phone: string | null | undefined, message: string) => {
    // Remove non-numeric characters, then strip leading 0 (e.g. 06261854014 -> 6261854014)
    const stripped = (phone || '').replace(/\D/g, '')
    const cleanPhone = stripped.startsWith('0') ? stripped.slice(1) : stripped
    // Add country code if missing (assumes India +91)
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
    const encodedMessage = encodeURIComponent(message || '')
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
    renewalReminder: (name: string, daysLeft: number, gymName: string, customTemplate?: string) => {
        if (customTemplate) {
            return customTemplate
                .replace(/{name}/g, name)
                .replace(/{gymName}/g, gymName)
                .replace(/{daysLeft}/g, String(daysLeft))
                .replace(/\\n/g, '\n')
        }
        return (
            `Hi ${name}!\n\n` +
            `Reminder from *${gymName}*: Aapki membership ${daysLeft === 0 ? 'aaj' : daysLeft === 1 ? 'kal' : `agli ${daysLeft} dino mein`} khatam ho rahi hai.\n\n` +
            `Please front desk pe aake renew karwa lein taaki aapka workout continue rahe. 💪\n\n` +
            `See you soon!\n${gymName}`
        )
    },

    /**
     * Sent upon successful new member registration.
     */
    welcomeMessage: (name: string, gymName: string, url?: string, customTemplate?: string) => {
        if (customTemplate) {
            return customTemplate
                .replace(/{name}/g, name)
                .replace(/{gymName}/g, gymName)
                .replace(/{url}/g, url || '')
                .replace(/\\n/g, '\n')
        }

        const invoiceLine = url ? `\n\nAapka joining invoice yahan hai: ${url}` : ''
        return (
            `Welcome to *${gymName}*, ${name}! 🎉\n\n` +
            `Hume khushi hai ki aap hamari community ka hissa bane. Aapka digital pass active ho gaya hai.${invoiceLine}\n\n` +
            `Koi bhi help chahiye ho toh front desk pe batayein. Let's start the fitness journey! 💪🏋️‍♂️\n\n` +
            `Regards,\n${gymName}`
        )
    },

    /**
     * Sent with invoice link after a payment is recorded.
     */
    invoiceShare: (name: string, gymName: string, amount: number, url?: string, customTemplate?: string) => {
        const formattedAmount = formatCurrency(amount)

        if (customTemplate) {
            return customTemplate
                .replace(/{name}/g, name)
                .replace(/{gymName}/g, gymName)
                .replace(/{amount}/g, formattedAmount)
                .replace(/{url}/g, url || '')
                .replace(/\\n/g, '\n')
        }

        const linkPart = url ? `\nAapka invoice link yahan hai:\n${url}\n` : ''
        return (
            `Hi ${name}, thank you for the payment of *${formattedAmount}* to *${gymName}*.\n\n` +
            `Payment record update ho gaya hai.${linkPart}\n` +
            `Keep crushing it! 🔥\n\n` +
            `Regards,\n${gymName}`
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
    paymentOverdue: (name: string, amount: number, gymName: string, customTemplate?: string) => {
        const formattedAmount = formatCurrency(amount)

        if (customTemplate) {
            return customTemplate
                .replace(/{name}/g, name)
                .replace(/{gymName}/g, gymName)
                .replace(/{amount}/g, formattedAmount)
                .replace(/\\n/g, '\n')
        }

        return (
            `Hi ${name}, *${gymName}* se reminder:\n\n` +
            `Aapka *${formattedAmount}* pending balance hai. Please use clear kar dein taaki koi interruption na ho.\n\n` +
            `Agar aapne pehle hi pay kar diya hai toh please ignore this message. Thanks! 🙏\n\n` +
            `Regards,\n${gymName}`
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

    /**
     * Sent to follow up with a prospective lead.
     */
    leadFollowUp: (name: string, gymName: string, planInterest?: string) => {
        const planLine = planInterest
            ? `We understand you were interested in our *${planInterest}* plan. `
            : ''
        return (
            `Dear ${name},\n\n` +
            `Thank you for your interest in *${gymName}*!\n\n` +
            `${planLine}We would be delighted to answer any questions and help you get started on your fitness journey.\n\n` +
            `Please feel free to visit us or reply to this message to schedule a tour of our facilities.\n\n` +
            `Warm regards,\n${gymName}`
        )
    },
}



export const getInvoiceWhatsAppLink = (
    phone: string,
    memberName: string,
    gymName: string,
    amount: number,
    shareToken: string,
    gymSlug: string,
    customTemplate?: string
): string | null => {
    const baseUrl = getBaseUrl()

    let url: string | undefined = undefined
    if (shareToken && typeof shareToken === 'string' && shareToken.trim()) {
        const safeToken = encodeURIComponent(shareToken.trim())
        url = `${baseUrl}/${gymSlug}/invoice/${safeToken}`
    } else {
        console.warn('WhatsApp Link: Missing shareToken, omitting URL from message')
    }

    const safeAmount = (!Number.isFinite(amount) || amount < 0) ? 0 : amount
    const formattedAmount = Number(safeAmount.toFixed(2))

    // Explicitly handle undefined gymName/memberName defaults so it doesn't template literally
    const safeGym = gymName || 'your gym'
    const safeMember = memberName || 'Customer'

    const message = templates.invoiceShare(safeMember, safeGym, formattedAmount, url, customTemplate)
    return getWhatsAppLink(phone, message)
}