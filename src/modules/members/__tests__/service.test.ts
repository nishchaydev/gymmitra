/**
 * Tier 2 — Service Layer Tests: MemberService
 * TDD: Verify member cap enforcement, duplicate prevention, and import logic.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemberService } from '../service'
import { prismaMock } from '@/vitest.setup'

vi.mock('@/lib/audit-logger', () => ({
  recordAuditLog: vi.fn(() => Promise.resolve(true))
}))

vi.mock('@/src/modules/billing/repository', () => ({
    BillingRepository: {
        generateInvoiceNumber: vi.fn(() => Promise.resolve('INV-001')),
        createInvoiceInTransaction: vi.fn(() => Promise.resolve({ id: 'inv-1', items: [] })),
        findInvoiceWithToken: vi.fn(() => Promise.resolve(null))
    }
}))

// Helper factory for gym settings
const createGymSettings = (saasPlan: string = 'TRIAL') => ({
  name: 'Test Gym',
  address: '123 Test St',
  phone: '9999999999',
  saasPlan
})

const defaultUserId = 'user-1'
const defaultIp = '127.0.0.1'

describe('MemberService.createMember', () => {
  const gymId = 'gym-1'

  beforeEach(() => {
    vi.resetAllMocks()

    // Setup transaction mock to just run the callback with prismaMock
    prismaMock.$transaction.mockImplementation(async (arg) => {
      if (Array.isArray(arg)) {
        return Promise.all(arg)
      }
      return arg(prismaMock as any)
    })
  })

  // 1. Success Flow
  it('successfully creates a member when under limit', async () => {
    // Gym is on MAIN_PLAN (limit 200)
    const settings = createGymSettings('MAIN_PLAN')
    
    // Not a duplicate phone
    prismaMock.member.findFirst.mockResolvedValueOnce(null)
    
    // Current count is 100 (well under 200)
    prismaMock.member.count.mockResolvedValueOnce(100)
    
    // Create succeeds
    prismaMock.member.create.mockResolvedValueOnce({ id: 'member-new', name: 'John Doe' } as any)
    
    const result = await MemberService.createMember(gymId, settings, defaultUserId, defaultIp, {
      name: 'John Doe',
      phone: '9876543210',
      planId: 'none', // skip subscription/invoice flow for this test
      dateOfBirth: null,
      customEndDate: null,
      discount: 0,
      whatsappConsentGiven: true,
      marketingConsentGiven: false
    })
    
    expect(result.success).toBe(true)
    expect(result.id).toBe('member-new')
    expect(prismaMock.member.count).toHaveBeenCalledTimes(1)
  })

  // 2. Cap Enforcement
  it('blocks creation when gym is at MAIN_PLAN limit (200 members)', async () => {
    const settings = createGymSettings('MAIN_PLAN')
    
    prismaMock.member.findFirst.mockResolvedValueOnce(null)
    
    // Current count is 200!
    prismaMock.member.count.mockResolvedValueOnce(200)
    
    await expect(
      MemberService.createMember(gymId, settings, defaultUserId, defaultIp, {
        name: 'Jane Doe',
        phone: '9876543210',
        planId: 'none',
        dateOfBirth: null,
        customEndDate: null,
        discount: 0,
        whatsappConsentGiven: true,
        marketingConsentGiven: false
      })
    ).rejects.toThrow('MEMBER_CAP:200:MAIN_PLAN')
    
    expect(prismaMock.member.create).not.toHaveBeenCalled()
  })

  // 3. TRIAL Plan (Unlimited)
  it('allows creation without counting when gym is on TRIAL plan', async () => {
    const settings = createGymSettings('TRIAL')
    
    prismaMock.member.findFirst.mockResolvedValueOnce(null)
    
    // No count query should be executed
    prismaMock.member.create.mockResolvedValueOnce({ id: 'member-trial', name: 'Trial User' } as any)
    
    const result = await MemberService.createMember(gymId, settings, defaultUserId, defaultIp, {
      name: 'Trial User',
      phone: '9876543210',
      planId: 'none',
      dateOfBirth: null,
      customEndDate: null,
      discount: 0,
      whatsappConsentGiven: true,
      marketingConsentGiven: false
    })
    
    expect(result.success).toBe(true)
    expect(prismaMock.member.count).not.toHaveBeenCalled()
  })

  // 4. Duplicate phone
  it('blocks creation if phone already exists', async () => {
    const settings = createGymSettings('TRIAL')
    
    // Phone already exists
    prismaMock.member.findFirst.mockResolvedValueOnce({ id: 'existing' } as any)
    
    const result = await MemberService.createMember(gymId, settings, defaultUserId, defaultIp, {
      name: 'Dup User',
      phone: '9876543210',
      planId: 'none',
      dateOfBirth: null,
      customEndDate: null,
      discount: 0,
      whatsappConsentGiven: true,
      marketingConsentGiven: false
    })
    
    expect(result as any).toHaveProperty('error')
    expect((result as any).error).toContain('already exists')
    expect(prismaMock.member.create).not.toHaveBeenCalled()
  })
})

describe('MemberService.importMembers', () => {
    const gymId = 'gym-1'
  
    beforeEach(() => {
      vi.resetAllMocks()
    })
  
    it('blocks import if rows exceed 500', async () => {
      // 501 rows
      const data = Array(501).fill({ name: 'John', phone: '9999999999' })
      
      const result = await MemberService.importMembers(data, gymId, defaultUserId, defaultIp)
      
      expect(result.error).toContain('limit exceeded: maximum 500 rows')
    })
  
    it('blocks import completely if gym is already at cap', async () => {
      const data = [{ name: 'John', phone: '9999999999' }]
      
      // MAIN_PLAN limit 200
      prismaMock.member.count.mockResolvedValueOnce(200)
      
      const result = await MemberService.importMembers(data, gymId, defaultUserId, defaultIp, 'MAIN_PLAN')
      
      expect(result.error).toContain('Member limit reached')
      expect(prismaMock.member.createMany).not.toHaveBeenCalled()
    })
  
    it('blocks import if batch size would exceed remaining cap', async () => {
      // 10 members in import
      const data = Array(10).fill({ name: 'John', phone: '9999999999' })
      
      // Current count 195 (only space for 5)
      prismaMock.member.count.mockResolvedValueOnce(195)
      
      const result = await MemberService.importMembers(data, gymId, defaultUserId, defaultIp, 'MAIN_PLAN')
      
      expect(result.error).toContain('would exceed member cap')
      expect(prismaMock.member.createMany).not.toHaveBeenCalled()
    })
  
    it('skips invalid phone and duplicates correctly', async () => {
      // 3 valid rows, 1 invalid phone, 1 duplicate
      const data = [
        { name: 'A', phone: '9000000001' },
        { name: 'B', phone: '9000000002' },
        { name: 'C', phone: 'invalid-phone' },   // Invalid
        { name: 'D', phone: '09000000001' },   // Normalizes to 9000000001 (duplicate in batch)
        { name: 'E', phone: '9000000003' },    // DB duplicate
      ]
      
      // Member count (TRIAL has no limit, but we pass TRIAL)
      // Existing phones in DB
      prismaMock.member.findMany.mockResolvedValue([{ phone: '9000000003' }] as any) // existing phone
      prismaMock.membershipPlan.findMany.mockResolvedValue([]) // no plans
      
      // Mocks for createMany
      prismaMock.member.createMany.mockResolvedValueOnce({ count: 2 } as any)
      
      const result = await MemberService.importMembers(data, gymId, defaultUserId, defaultIp, 'TRIAL')
      
      expect(result.error).toBeUndefined()
      expect(result.imported).toBe(2) // A and B
      expect(result.skippedInvalidData).toBe(1) // C
      expect(result.skippedDuplicate).toBe(2) // D and E
    })
  })
