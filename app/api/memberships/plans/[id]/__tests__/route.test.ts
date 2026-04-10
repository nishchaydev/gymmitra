import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { PUT, DELETE } from '../route'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { DeepMockProxy } from 'vitest-mock-extended'
import { PrismaClient } from '@prisma/client'

// Mock local dependencies
vi.mock('@/lib/auth', () => ({
  getAuthGym: vi.fn(),
  checkRole: vi.fn(),
}))

// Use the globally mocked prisma instance
const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>
const getAuthGymMock = vi.mocked(getAuthGym)

describe('Membership Plan API Route', () => {
  const mockGym = { id: 'gym_1', slug: 'test-gym' }
  const mockAuth = { gym: mockGym, userId: 'user_1', role: 'OWNER' }

  beforeEach(() => {
    vi.clearAllMocks()
    getAuthGymMock.mockResolvedValue(mockAuth as any)
  })

  describe('DELETE', () => {
    it('should perform a hard delete if no subscriptions exist', async () => {
      prismaMock.membershipPlan.findFirst.mockResolvedValueOnce({ id: 'plan_1', gymId: 'gym_1' } as any)
      prismaMock.memberSubscription.count.mockResolvedValueOnce(0)
      prismaMock.membershipPlan.deleteMany.mockResolvedValueOnce({ count: 1 })

      const req = new NextRequest('http://localhost/api/memberships/plans/plan_1', { method: 'DELETE' })
      const res = await DELETE(req, { params: Promise.resolve({ id: 'plan_1' }) })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(prismaMock.membershipPlan.deleteMany).toHaveBeenCalled()
      expect(prismaMock.membershipPlan.updateMany).not.toHaveBeenCalled()
    })

    it('should perform a soft delete if subscriptions exist', async () => {
      prismaMock.membershipPlan.findFirst.mockResolvedValue({ id: 'plan_1', gymId: 'gym_1' } as any)
      prismaMock.memberSubscription.count.mockResolvedValueOnce(5)
      prismaMock.membershipPlan.updateMany.mockResolvedValueOnce({ count: 1 })

      const req = new NextRequest('http://localhost/api/memberships/plans/plan_1', { method: 'DELETE' })
      const res = await DELETE(req, { params: Promise.resolve({ id: 'plan_1' }) })

      expect(res.status).toBe(200)
      expect(prismaMock.membershipPlan.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: false }
        })
      )
      expect(prismaMock.membershipPlan.deleteMany).not.toHaveBeenCalled()
    })

    it('should prevent IDOR on delete', async () => {
      // Plan exists but belongs to another gym
      prismaMock.membershipPlan.findFirst.mockResolvedValueOnce(null)

      const req = new NextRequest('http://localhost/api/memberships/plans/plan_other', { method: 'DELETE' })
      const res = await DELETE(req, { params: Promise.resolve({ id: 'plan_other' }) })

      expect(res.status).toBe(404)
      expect(prismaMock.membershipPlan.deleteMany).not.toHaveBeenCalled()
    })
  })

  describe('PUT', () => {
    it('should update plan if owned by gym', async () => {
      const payload = {
        name: 'Gold Plan Updated',
        duration: 12,
        price: 999
      }
      prismaMock.membershipPlan.findFirst.mockResolvedValue({ id: 'plan_1', gymId: 'gym_1' } as any)
      prismaMock.membershipPlan.updateMany.mockResolvedValueOnce({ count: 1 })

      const req = new NextRequest('http://localhost/api/memberships/plans/plan_1', {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      const res = await PUT(req, { params: Promise.resolve({ id: 'plan_1' }) })

      expect(res.status).toBe(200)
      expect(prismaMock.membershipPlan.updateMany).toHaveBeenCalled()
    })
  })
})
