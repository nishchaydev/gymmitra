/**
 * Shared Formatters — Single Source of Truth
 * 
 * All formatting utilities used across modules.
 * Prevents duplication of format logic in components and services.
 */

/**
 * Format a number as Indian Rupees (₹).
 * @example formatINR(5000) → "₹5,000"
 * @example formatINR(5000.5) → "₹5,001" (rounded)
 */
export function formatINR(amount: number | string | null | undefined): string {
  if (amount == null) return '₹0'
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(num)) return '₹0'
  return `₹${Math.round(num).toLocaleString('en-IN')}`
}

/**
 * Format a date for display (Indian locale).
 * @example formatDate(new Date()) → "29 Mar 2026"
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Format a date and time for display.
 * @example formatDateTime(new Date()) → "29 Mar 2026, 10:30 AM"
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

/**
 * Format phone number for display (Indian format).
 * @example formatPhone("9876543210") → "+91 98765 43210"
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '—'
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  }
  return phone
}

/**
 * Capitalize first letter of each word.
 * @example titleCase("john doe") → "John Doe"
 */
export function titleCase(str: string): string {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase())
}
