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
            `Reminder from *${gymName}*: Your membership expires ${daysLeft === 0 ? 'today' : daysLeft === 1 ? 'tomorrow' : `in ${daysLeft} days`}.\n\n` +
            `Please visit the front desk to renew so your workout continues uninterrupted. 💪\n\n` +
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

        const invoiceLine = url ? `\n\nYour joining invoice is here: ${url}` : ''
        return (
            `Welcome to *${gymName}*, ${name}! 🎉\n\n` +
            `We're happy to have you as part of our community. Your digital pass is now active.${invoiceLine}\n\n` +
            `If you need any help, please contact the front desk. Let's start your fitness journey! 💪🏋️‍♂️\n\n` +
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
     * Sent with invoice link after a payment is recorded.
     */
    invoiceShare: (name: string, gymName: string, amount: number, url?: string, customTemplate?: string) => {
        const formattedAmount = formatCurrency(amount)

        if (customTemplate) {
            return customTemplate
                .replace(/{name}/g, name)
                .replace(/{gymName}/g, gymName)
                .replace(/{amount}/g, formattedAmount)
                .replace(/\\n/g, '\n')
        }

        const linkPart = url ? `\nYour invoice link is here:\n${url}\n` : ''
        return (
            `Hi ${name}, thank you for your payment of *${formattedAmount}* to *${gymName}*.\n\n` +
            `Your payment record has been updated.${linkPart}\n` +
            `Keep crushing it! 🔥\n\n` +
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

    /**
     * Sent when a member has an overdue payment / outstanding balance.
     * Supports custom template override via gym settings (waOverdueMsg).
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
            `Dear ${name},\n\n` +
            `This is a gentle reminder from *${gymName}* regarding an outstanding balance of *${formattedAmount}*.` +
            `\n\nKindly settle the amount at your earliest convenience at the front desk or via UPI.\n\n` +
            `If you have already made the payment, please disregard this message.\n\n` +
            `Thank you,\n${gymName}`
        )
    },

    /**
     * Sent to collect member feedback after a milestone (e.g., 1 month).
     * Enterprise feature for member satisfaction tracking.
     */
    feedbackRequest: (name: string, gymName: string, milestoneDays: number) => {
        return (
            `Dear ${name},\n\n` +
            `Congratulations on completing *${milestoneDays} days* at *${gymName}*! 🎉\n\n` +
            `We would love to hear about your experience so far. Your feedback helps us serve you better.\n\n` +
            `Please reply with a rating from 1-5 (5 being excellent) and any suggestions you may have.\n\n` +
            `Thank you for being part of our community!\n\n` +
            `Warm regards,\n${gymName}`
        )
    },
}

/**
 * Send a WhatsApp template message via Meta Cloud API.
 * Requires WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN env vars.
 * Silently skips if env vars are not configured.
 */
export async function sendWhatsAppTemplate(params: {
    to: string
    templateName: string
    languageCode?: string
    components?: Array<{
        type: string
        parameters: Array<{ type: string; text?: string }>
    }>
}): Promise<{ success: boolean; error?: string }> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (!phoneNumberId || !accessToken) {
        console.warn('[WhatsApp] WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set, skipping template send')
        return { success: false, error: 'WhatsApp not configured' }
    }

    // Normalize phone: strip non-digits, add 91 prefix if 10 digits
    const stripped = params.to.replace(/\D/g, '')
    const formattedPhone = stripped.length === 10 ? `91${stripped}` : stripped

    try {
        const response = await fetch(
            `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messaging_product: 'whatsapp',
                    to: formattedPhone,
                    type: 'template',
                    template: {
                        name: params.templateName,
                        language: { code: params.languageCode || 'en' },
                        ...(params.components && { components: params.components }),
                    },
                }),
            }
        )

        if (!response.ok) {
            const err = await response.json().catch(() => ({}))
            console.error('[WhatsApp] Template send failed:', err)
            return { success: false, error: JSON.stringify(err) }
        }

        return { success: true }
    } catch (error: any) {
        console.error('[WhatsApp] Network error:', error)
        return { success: false, error: error.message }
    }
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