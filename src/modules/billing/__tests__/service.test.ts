/**
 * Tier 2 — Service Layer Tests: BillingService
 * TDD: Verify correct payment recording and transition of statuses.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BillingService } from '../service'
import { prismaMock } from '@/vitest.setup'

vi.mock('@/lib/audit-logger', () => ({
  recordAuditLog: vi.fn(() => Promise.resolve(true))
}))

describe('BillingService.recordPayment', () => {
  const gymId = 'gym-1'
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock the transaction execution to just fire the callback
    // with the prismaMock as the transaction client
    prismaMock.$transaction.mockImplementation(async (arg) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg)
      }
      return arg(prismaMock as any)
    })
  })

  it('rejects overpayment cleanly without silently clamping', async () => {
    const invoiceId = 'inv-partial'
    
    // Member has ₹500 outstanding
    prismaMock.invoice.findFirst.mockResolvedValueOnce({
      id: invoiceId,
      gymId,
      total: 1000,
      amountPaid: 500,
      paymentStatus: 'PARTIAL'
    } as any)
    
    // They try to pay ₹600
    const result = await BillingService.recordPayment(gymId, {
      invoiceId,
      additionalAmount: 600
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Overpayment rejected')
    
    // No update should happen
    expect(prismaMock.invoice.update).not.toHaveBeenCalled()
  })

  it('correctly transitions PARTIAL to PAID on full payment', async () => {
    const invoiceId = 'inv-partial-to-paid'
    
    prismaMock.invoice.findFirst.mockResolvedValueOnce({
      id: invoiceId,
      gymId,
      total: 1000,
      amountPaid: 600,
      paymentStatus: 'PARTIAL'
    } as any)
    
    // They pay exactly the remaining ₹400
    prismaMock.invoice.update.mockResolvedValueOnce({} as any)
    
    const result = await BillingService.recordPayment(gymId, {
      invoiceId,
      additionalAmount: 400
    })
    
    expect(result.success).toBe(true)
    
    // Verify math & status transition
    expect(prismaMock.invoice.update).toHaveBeenCalledWith({
      where: { id: invoiceId },
      data: {
        amountPaid: 1000,
        balanceDue: 0,
        paymentStatus: 'PAID'
      }
    })
  })

  it('correctly remains PARTIAL on partial payment', async () => {
    const invoiceId = 'inv-partial-more'
    
    // Member owed ₹1000, previously paid nothing
    prismaMock.invoice.findFirst.mockResolvedValueOnce({
      id: invoiceId,
      gymId,
      total: 1000,
      amountPaid: 0,
      paymentStatus: 'PENDING'
    } as any)
    
    prismaMock.invoice.update.mockResolvedValueOnce({} as any)
    
    // They pay ₹300
    const result = await BillingService.recordPayment(gymId, {
      invoiceId,
      additionalAmount: 300
    })
    
    expect(result.success).toBe(true)
    
    expect(prismaMock.invoice.update).toHaveBeenCalledWith({
      where: { id: invoiceId },
      data: {
        amountPaid: 300,
        balanceDue: 700,
        paymentStatus: 'PARTIAL' // Ensure it moved from PENDING to PARTIAL
      }
    })
  })

  it('rejects payment on already PAID invoice', async () => {
    const invoiceId = 'inv-paid'
    
    prismaMock.invoice.findFirst.mockResolvedValueOnce({
      id: invoiceId,
      gymId,
      total: 1000,
      amountPaid: 1000,
      paymentStatus: 'PAID'
    } as any)
    
    const result = await BillingService.recordPayment(gymId, {
      invoiceId,
      additionalAmount: 100
    })
    
    expect(result.success).toBe(false)
    expect(result.error).toContain('Invoice is already fully paid')
  })
})
