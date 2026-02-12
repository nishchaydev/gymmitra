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
    }
}
