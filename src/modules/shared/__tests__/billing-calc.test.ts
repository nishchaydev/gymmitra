/**
 * Tier 1 — Pure Function Tests: billing-calc.ts
 * TDD: Tests verify BEHAVIOR through public interface.
 * No mocks needed — these are pure functions.
 */
import { describe, it, expect } from 'vitest'
import {
  calculateBillingTotal,
  resolveEffectiveTaxRate,
  distributeTaxAcrossItems,
} from '../billing-calc'

// ── calculateBillingTotal ──────────────────────────────────────────────────────

describe('calculateBillingTotal', () => {
  it('single item, no tax, no discount → correct totals', () => {
    const result = calculateBillingTotal([{ quantity: 1, unitPrice: 5000 }], 0, 0)
    expect(result.subtotal).toBe(5000)
    expect(result.discount).toBe(0)
    expect(result.taxAmount).toBe(0)
    expect(result.total).toBe(5000)
  })

  it('applies flat discount BEFORE tax (₹500 off ₹5000, 18% GST)', () => {
    // subtotal=5000, discount=500 → after=4500, tax=810, total=5310
    const result = calculateBillingTotal([{ quantity: 1, unitPrice: 5000 }], 500, 18)
    expect(result.subtotal).toBe(5000)
    expect(result.subtotalAfterDiscount).toBe(4500)
    expect(result.taxAmount).toBe(810)
    expect(result.total).toBe(5310)
  })

  it('multiple line items sum correctly', () => {
    const result = calculateBillingTotal(
      [
        { quantity: 2, unitPrice: 100 }, // 200
        { quantity: 3, unitPrice: 50 },  // 150
      ],
      0,
      0
    )
    expect(result.subtotal).toBe(350)
    expect(result.total).toBe(350)
  })

  it('discount larger than subtotal → total is 0, never negative', () => {
    const result = calculateBillingTotal([{ quantity: 1, unitPrice: 100 }], 999, 18)
    expect(result.subtotalAfterDiscount).toBe(0)
    expect(result.taxAmount).toBe(0)
    expect(result.total).toBe(0)
  })

  it('common gym plan: ₹1,499 + 18% GST → no floating-point errors', () => {
    // 1499 * 0.18 = 269.82 — must not produce 269.8200000001
    const result = calculateBillingTotal([{ quantity: 1, unitPrice: 1499 }], 0, 18)
    expect(result.taxAmount).toBe(269.82)
    expect(result.total).toBe(1768.82)
  })

  it('zero-value item list → all zeros', () => {
    const result = calculateBillingTotal([], 0, 18)
    expect(result.subtotal).toBe(0)
    expect(result.total).toBe(0)
    expect(result.taxAmount).toBe(0)
  })

  it('fractional quantities work correctly', () => {
    // 0.5 × ₹200 = ₹100
    const result = calculateBillingTotal([{ quantity: 0.5, unitPrice: 200 }], 0, 0)
    expect(result.subtotal).toBe(100)
    expect(result.total).toBe(100)
  })
})

// ── resolveEffectiveTaxRate ────────────────────────────────────────────────────

describe('resolveEffectiveTaxRate', () => {
  it('returns 0 when gym tax is disabled (regardless of rates)', () => {
    expect(resolveEffectiveTaxRate(false, 18, 28)).toBe(0)
  })

  it('uses gym default rate when no per-invoice override', () => {
    expect(resolveEffectiveTaxRate(true, 18)).toBe(18)
  })

  it('uses override rate when explicitly provided', () => {
    expect(resolveEffectiveTaxRate(true, 18, 12)).toBe(12)
  })

  it('override of 0 is respected (zero-rated / GST exempt)', () => {
    // Gyms can have tax enabled but send 0% for specific invoices
    expect(resolveEffectiveTaxRate(true, 18, 0)).toBe(0)
  })

  it('null override falls back to gym default', () => {
    expect(resolveEffectiveTaxRate(true, 18, null)).toBe(18)
  })

  it('undefined override falls back to gym default', () => {
    expect(resolveEffectiveTaxRate(true, 18, undefined)).toBe(18)
  })
})

// ── distributeTaxAcrossItems ───────────────────────────────────────────────────

describe('distributeTaxAcrossItems', () => {
  it('single item receives all tax', () => {
    const taxes = distributeTaxAcrossItems([{ quantity: 1, unitPrice: 1000 }], 18000)
    expect(taxes).toHaveLength(1)
    expect(taxes[0]).toBe(18000)
  })

  it('distributes proportionally: 80/20 split', () => {
    const taxes = distributeTaxAcrossItems(
      [
        { quantity: 1, unitPrice: 800 }, // 80%
        { quantity: 1, unitPrice: 200 }, // 20%
      ],
      18000 // ₹180 in cents
    )
    expect(taxes[0]).toBe(14400) // 80% of 18000
    expect(taxes[1]).toBe(3600)  // 20% of 18000
  })

  it('total tax is preserved — no penny lost to rounding', () => {
    // 100 cents ÷ 3 items = 33.33... — last item must absorb remainder
    const taxes = distributeTaxAcrossItems(
      [
        { quantity: 1, unitPrice: 100 },
        { quantity: 1, unitPrice: 100 },
        { quantity: 1, unitPrice: 100 },
      ],
      100 // 100 cents total
    )
    const sum = taxes.reduce((a, b) => a + b, 0)
    expect(sum).toBe(100)
    expect(taxes).toHaveLength(3)
  })

  it('zero-subtotal items → all zeros', () => {
    const taxes = distributeTaxAcrossItems([{ quantity: 0, unitPrice: 0 }], 0)
    expect(taxes[0]).toBe(0)
  })

  it('zero total tax → all zeros distributed', () => {
    const taxes = distributeTaxAcrossItems(
      [{ quantity: 1, unitPrice: 500 }, { quantity: 1, unitPrice: 300 }],
      0
    )
    expect(taxes).toEqual([0, 0])
  })
})
