import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { BillingService } from '@/src/modules/billing/service'

// Mock global dependencies
vi.mock('@/lib/auth', () => ({
  getAuthGym: vi.fn(),
  checkRole: vi.fn().mockReturnValue(null), // Default to success
}))

vi.mock('@/lib/rate-limit', () => ({
  apiLimiter: {
    check: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@/src/modules/billing/service', () => ({
  BillingService: {
    createInvoice: vi.fn(),
  },
}))

import { DeepMockProxy } from 'vitest-mock-extended'
import { PrismaClient } from '@prisma/client'

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>
const getAuthGymMock = vi.mocked(getAuthGym)
const billingServiceMock = vi.mocked(BillingService)

describe('Invoices API Route', () => {
  const mockGym = { id: 'gym_1', slug: 'test-gym' }
  const mockAuth = { gym: mockGym, userId: 'user_1', role: 'OWNER' }

  beforeEach(() => {
    vi.clearAllMocks()
    getAuthGymMock.mockResolvedValue(mockAuth as any)
  })

  describe('GET', () => {
    it('should return 401 if unauthorized', async () => {
      getAuthGymMock.mockResolvedValueOnce(null)
      const req = new NextRequest('http://localhost/api/invoices')
      const res = await GET(req)
      expect(res.status).toBe(401)
    })

    it('should return invoices for the gym', async () => {
      const mockInvoices = [{ id: 'inv_1', invoiceNumber: 'INV-001', items: [] }]
      prismaMock.invoice.findMany.mockResolvedValue(mockInvoices as any)
      prismaMock.invoice.count.mockResolvedValue(1)

      const req = new NextRequest('http://localhost/api/invoices')
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.invoices).toHaveLength(1)
      expect(prismaMock.invoice.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ gymId: 'gym_1' })
        })
      )
    })

    it('should prevent IDOR when filtering by memberId', async () => {
      // Mock member belonging to another gym
      prismaMock.member.findFirst.mockResolvedValueOnce(null)

      const req = new NextRequest('http://localhost/api/invoices?memberId=other_member')
      const res = await GET(req)

      expect(res.status).toBe(404)
      expect(prismaMock.invoice.findMany).not.toHaveBeenCalled()
    })
  })

  describe('POST', () => {
    it('should successfully create an invoice', async () => {
      const payload = {
        type: 'SALE',
        paymentStatus: 'PAID',
        items: [{ description: 'Test Item', quantity: 1, unitPrice: 10, type: 'OTHER' }]
      }

      billingServiceMock.createInvoice.mockResolvedValueOnce({ success: true, id: 'inv_new' })
      prismaMock.invoice.findUnique.mockResolvedValueOnce({ id: 'inv_new', items: [] } as any)

      const req = new NextRequest('http://localhost/api/invoices', {
        method: 'POST',
        body: JSON.stringify(payload)
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.id).toBe('inv_new')
      expect(billingServiceMock.createInvoice).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'gym_1' }),
        expect.objectContaining({ type: 'SALE' }),
        'user_1',
        expect.any(String)
      )
    })

    it('should return 400 for invalid payload', async () => {
      const req = new NextRequest('http://localhost/api/invoices', {
        method: 'POST',
        body: JSON.stringify({ items: [] }) // Missing required items or fields
      })

      const res = await POST(req)
      expect(res.status).toBe(400)
    })
  })
})
