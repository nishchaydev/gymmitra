/**
 * Tier 2 — Service Layer Tests: ExpenseService
 * TDD: Test behavior through ExpenseService.createExpense
 * Uses Prisma mocks.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ExpenseService } from '../service'
import { prismaMock } from '@/vitest.setup'

vi.mock('@/lib/audit-logger', () => ({
  recordAuditLog: vi.fn(() => Promise.resolve(true))
}))

const service = new ExpenseService()

describe('ExpenseService', () => {
  const gymId = 'gym-123'
  const userId = 'user-456'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createExpense', () => {
    it('creates an expense and records an audit log', async () => {
      const expenseData = {
        amount: 500,
        category: 'MAINTENANCE',
        description: 'New dumbbell set',
        date: new Date('2024-04-14')
      }

      const createdExpense = {
        id: 'exp-1',
        gymId,
        ...expenseData
      }

      // Mock DB create
      prismaMock.expense.create.mockResolvedValueOnce(createdExpense as any)

      const result = await service.createExpense(gymId, userId, expenseData as any)

      expect(result.success).toBe(true)
      expect(prismaMock.expense.create).toHaveBeenCalledWith({
        data: {
          ...expenseData,
          gymId
        }
      })

      // Verify audit log
      const { recordAuditLog } = await import('@/lib/audit-logger')
      expect(recordAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        gymId,
        actorId: userId,
        action: 'CREATE_EXPENSE',
        entityType: 'EXPENSE',
        entityId: 'exp-1'
      }))
    })

    it('returns failure if repository fails', async () => {
       prismaMock.expense.create.mockRejectedValueOnce(new Error('DB Error'))
       
       const result = await service.createExpense(gymId, userId, {} as any)
       expect(result.success).toBe(false)
       expect(result.error).toBeDefined()
    })
  })

  describe('deleteExpense', () => {
    it('deletes an expense and records an audit log', async () => {
      const expenseId = 'exp-del-1'

      prismaMock.expense.delete.mockResolvedValueOnce({ id: expenseId } as any)

      const result = await service.deleteExpense(gymId, userId, expenseId)

      expect(result.success).toBe(true)
      expect(prismaMock.expense.delete).toHaveBeenCalledWith({
        where: { id: expenseId, gymId }
      })

      // Verify audit log
      const { recordAuditLog } = await import('@/lib/audit-logger')
      expect(recordAuditLog).toHaveBeenCalledWith(expect.objectContaining({
        gymId,
        actorId: userId,
        action: 'DELETE_EXPENSE',
        entityType: 'EXPENSE',
        entityId: expenseId
      }))
    })

    it('returns failure if delete fails', async () => {
      prismaMock.expense.delete.mockRejectedValueOnce(new Error('Not found'))

      const result = await service.deleteExpense(gymId, userId, 'invalid-id')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
