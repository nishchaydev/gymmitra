/**
 * Tier 2 — Service Layer Tests: AttendanceService
 * TDD: Test behavior through AttendanceService.checkIn
 * Uses Prisma mocks.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AttendanceService } from '../service'
import { prismaMock } from '@/vitest.setup'
import { addDays, subDays } from 'date-fns'

vi.mock('@/lib/audit-logger', () => ({
  recordAuditLog: vi.fn(() => Promise.resolve(true))
}))

const service = new AttendanceService()

describe('AttendanceService.checkIn', () => {
  const gymId = 'gym-1'
  const timezone = 'Asia/Kolkata'
  const userId = 'user-1'
  const ip = '127.0.0.1'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // 1. Success Cases
  it('successfully checks in an active member', async () => {
    const memberId = 'member-1'
    
    // Mock the member finding
    prismaMock.member.findFirst.mockResolvedValueOnce({
      id: memberId,
      gymId,
      status: 'ACTIVE',
      name: 'John Doe',
      subscriptions: [{
        endDate: addDays(new Date(), 30),
      }]
    } as any)
    
    // Staff not found since member found
    prismaMock.staffMember.findFirst.mockResolvedValueOnce(null)
    
    // No existing attendance
    prismaMock.attendance.findUnique.mockResolvedValueOnce(null)
    
    // Mock create return
    const expectedAttendance = { id: 'att-1', memberId }
    prismaMock.attendance.create.mockResolvedValueOnce(expectedAttendance as any)
    
    const result = await service.checkIn(gymId, timezone, { memberId }, userId, ip)
    
    expect(result.id).toBe('att-1')
    expect(prismaMock.attendance.create).toHaveBeenCalledTimes(1)
  })

  // 2. Block: Expired Member
  it('blocks check-in if member subscription has expired', async () => {
    const memberId = 'member-expired'
    
    // Mock member with EXPIRED status
    prismaMock.member.findFirst.mockResolvedValueOnce({
      id: memberId,
      gymId,
      status: 'EXPIRED',
      name: 'Jane Doe',
      subscriptions: [{
        endDate: subDays(new Date(), 10), // Expired 10 days ago
      }]
    } as any)
    
    await expect(service.checkIn(gymId, timezone, { memberId }, userId, ip))
      .rejects.toThrow('Check-in denied. Membership has expired or is inactive.')
    
    // Ensure attendance wasn't created
    expect(prismaMock.attendance.create).not.toHaveBeenCalled()
  })

  // 3. Block: Paused Member
  it('blocks check-in if member is PAUSED', async () => {
    const memberId = 'member-paused'
    
    prismaMock.member.findFirst.mockResolvedValueOnce({
      id: memberId,
      gymId,
      status: 'ACTIVE',
      memberState: 'PAUSED', // The flag for active but frozen sub
      name: 'Jim Doe',
      subscriptions: [{
        endDate: addDays(new Date(), 30),
      }]
    } as any)
    
    await expect(service.checkIn(gymId, timezone, { memberId }, userId, ip))
      .rejects.toThrow('Check-in denied. Membership is currently paused.')
      
    expect(prismaMock.attendance.create).not.toHaveBeenCalled()
  })

  // 4. Block: Duplicate Check-in
  it('blocks check-in if member already checked in today', async () => {
    const memberId = 'member-duplicate'
    
    prismaMock.member.findFirst.mockResolvedValueOnce({
      id: memberId,
      gymId,
      status: 'ACTIVE',
      name: 'Dup Doe',
      subscriptions: [{
        endDate: addDays(new Date(), 30),
      }]
    } as any)
    
    // Mock existing attendance!
    prismaMock.attendance.findUnique.mockResolvedValueOnce({
      id: 'att-old',
      memberId
    } as any)
    
    await expect(service.checkIn(gymId, timezone, { memberId }, userId, ip))
      .rejects.toThrow('Member already checked in today')
      
    expect(prismaMock.attendance.create).not.toHaveBeenCalled()
  })

  // 5. Staff Member Flow
  it('successfully checks in an active staff member', async () => {
    const staffId = 'staff-1'
    
    // Member not found
    prismaMock.member.findFirst.mockResolvedValueOnce(null)
    
    // Staff found
    prismaMock.staffMember.findFirst.mockResolvedValueOnce({
      id: staffId,
      gymId,
      isActive: true,
      name: 'Coach Mike'
    } as any)
    
    // No existing
    prismaMock.attendance.findFirst.mockResolvedValueOnce(null)
    
    prismaMock.attendance.create.mockResolvedValueOnce({ id: 'att-staff', staffId, staff: { name: 'Coach Mike' } } as any)
    
    const result = await service.checkIn(gymId, timezone, { memberId: staffId }, userId, ip)
    expect(result.id).toBe('att-staff')
    expect(prismaMock.attendance.create).toHaveBeenCalledTimes(1)
  })

  it('blocks check-in for inactive staff member', async () => {
    const staffId = 'staff-inactive'
    
    prismaMock.member.findFirst.mockResolvedValueOnce(null)
    
    prismaMock.staffMember.findFirst.mockResolvedValueOnce({
      id: staffId,
      gymId,
      isActive: false, // Inactive!
      name: 'Ex Coach Mike'
    } as any)
    
    await expect(service.checkIn(gymId, timezone, { memberId: staffId }, userId, ip))
      .rejects.toThrow('Check-in denied. Staff member is inactive.')
  })
})
