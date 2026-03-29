/**
 * Billing Calculation Module — Single Source of Truth
 * 
 * All tax and total calculations MUST go through these functions.
 * Replaces scattered calculation logic in:
 *   - lib/invoice-utils.ts (calculateInvoiceTotal)
 *   - invoices/actions.ts (inline calc)
 *   - pos/actions.ts (inline calc)
 *   - NewInvoiceForm.tsx (frontend calc)
 */

export interface InvoiceLineItem {
  quantity: number
  unitPrice: number
}

export interface BillingCalcResult {
  /** Sum of all items (qty × price) */
  subtotal: number
  /** Discount amount applied */
  discount: number
  /** Subtotal minus discount */
  subtotalAfterDiscount: number
  /** Tax amount (on discounted subtotal) */
  taxAmount: number
  /** Effective tax rate used */
  taxPercentage: number
  /** Final total = subtotalAfterDiscount + taxAmount */
  total: number
}

/**
 * Calculate invoice totals with optional tax.
 * Uses integer arithmetic (cents) internally to avoid floating-point errors.
 * 
 * @param items - Line items with quantity and unit price
 * @param discount - Flat discount in currency (default 0)
 * @param taxPercentage - GST rate to apply (default 0 = no tax)
 * @returns Computed billing breakdown
 * 
 * @example
 * ```ts
 * const result = calculateBillingTotal(
 *   [{ quantity: 1, unitPrice: 5000 }],
 *   500,   // ₹500 discount
 *   18     // 18% GST
 * )
 * // result.total = 5310 (4500 + 810 tax)
 * ```
 */
export function calculateBillingTotal(
  items: InvoiceLineItem[],
  discount: number = 0,
  taxPercentage: number = 0
): BillingCalcResult {
  // Integer arithmetic in cents for precision
  const subtotalCents = items.reduce(
    (acc, item) => acc + Math.round(item.quantity * item.unitPrice * 100),
    0
  )
  const discountCents = Math.round(discount * 100)
  const subtotalAfterDiscountCents = Math.max(0, subtotalCents - discountCents)

  const taxAmountCents = Math.round((subtotalAfterDiscountCents * taxPercentage) / 100)
  const totalCents = subtotalAfterDiscountCents + taxAmountCents

  return {
    subtotal: subtotalCents / 100,
    discount,
    subtotalAfterDiscount: subtotalAfterDiscountCents / 100,
    taxAmount: taxAmountCents / 100,
    taxPercentage,
    total: totalCents / 100,
  }
}

/**
 * Resolve the effective tax percentage for an invoice.
 * Priority: explicit override > gym default > 0
 * 
 * @param gymTaxEnabled - Whether the gym has tax collection enabled
 * @param gymDefaultRate - The gym's default tax rate
 * @param overrideRate - Per-invoice override (from form)
 */
export function resolveEffectiveTaxRate(
  gymTaxEnabled: boolean,
  gymDefaultRate: number = 18,
  overrideRate?: number | null
): number {
  if (!gymTaxEnabled) return 0
  if (overrideRate != null && overrideRate >= 0) return overrideRate
  return gymDefaultRate
}

/**
 * Distribute total tax across line items proportionally.
 * Ensures no rounding loss — remainder goes to last item.
 */
export function distributeTaxAcrossItems(
  items: InvoiceLineItem[],
  totalTaxAmountCents: number
): number[] {
  const totalSubtotalCents = items.reduce(
    (acc, item) => acc + Math.round(item.quantity * item.unitPrice * 100),
    0
  )

  if (totalSubtotalCents === 0) return items.map(() => 0)

  let remainingTax = totalTaxAmountCents
  const taxes: number[] = []

  for (let i = 0; i < items.length; i++) {
    if (i === items.length - 1) {
      // Last item gets the remainder to avoid rounding loss
      taxes.push(remainingTax)
    } else {
      const itemCents = Math.round(items[i].quantity * items[i].unitPrice * 100)
      const itemTax = Math.round(totalTaxAmountCents * (itemCents / totalSubtotalCents))
      taxes.push(itemTax)
      remainingTax -= itemTax
    }
  }

  return taxes
}
