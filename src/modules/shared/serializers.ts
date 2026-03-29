/**
 * Data Serializers — Boundary Normalization
 * 
 * Converts Prisma Decimal fields to plain JavaScript numbers
 * before data crosses the API/component boundary.
 * 
 * RULE: No raw Decimal should ever reach the frontend.
 * Call serializeDecimals() at every data exit point.
 */

/**
 * Recursively converts all Prisma Decimal instances to plain numbers.
 * Also converts any object with a toNumber() method (Decimal-like).
 * 
 * @example
 * ```ts
 * const member = await prisma.member.findFirst({ include: { subscriptions: true } })
 * return serializeDecimals(member) // All Decimal fields → Number
 * ```
 */
export function serializeDecimals<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj

  // Handle Decimal-like objects (has toNumber method)
  if (typeof obj === 'object' && 'toNumber' in (obj as any) && typeof (obj as any).toNumber === 'function') {
    return (obj as any).toNumber() as T
  }

  // Handle Date — don't recurse into it
  if (obj instanceof Date) return obj

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeDecimals(item)) as T
  }

  // Handle plain objects
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = serializeDecimals(value)
    }
    return result as T
  }

  return obj
}

/**
 * Converts a single value that might be a Decimal to a number.
 * Safely handles null, undefined, string, and number inputs.
 * 
 * @example
 * ```ts
 * const price = toNumber(plan.price) // Decimal → number
 * const tax = toNumber(invoice.taxPercentage) // Decimal | null → number
 * ```
 */
export function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }
  if (typeof value === 'object' && 'toNumber' in (value as any) && typeof (value as any).toNumber === 'function') {
    return (value as any).toNumber()
  }
  return 0
}
