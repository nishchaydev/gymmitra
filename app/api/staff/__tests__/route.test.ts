import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'
import { prismaMock } from '@/vitest.setup'
import { DeepMockProxy } from 'vitest-mock-extended'
import { PrismaClient } from '@prisma/client'

// Use the globally mocked prisma instance
const mockPrisma = prismaMock as unknown as DeepMockProxy<PrismaClient>

vi.mock('@/lib/auth', () => ({
    getAuthGym: vi.fn(),
    checkRole: vi.fn(),
}))

vi.mock('@/lib/crypto', () => ({
    encryptPassword: vi.fn().mockReturnValue('mocked-encrypted-pwd'),
}))

vi.mock('@/lib/rate-limit', () => ({
    guardRateLimit: vi.fn().mockResolvedValue(null),
}))

vi.mock('@/lib/supabase/admin', () => ({
    createAdminClient: vi.fn().mockReturnValue({
        auth: {
            admin: {
                createUser: vi.fn(),
                deleteUser: vi.fn(),
            }
        }
    }),
}))

vi.mock('resend', () => ({
    Resend: vi.fn().mockImplementation(() => ({
        emails: { send: vi.fn().mockResolvedValue({}) }
    }))
}))

import { getAuthGym, checkRole } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

describe('Staff API', () => {
    const gymId = 'gym-123'
    const ownerId = 'owner-456'

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('GET', () => {
        it('should return staff list for owner', async () => {
            ;(getAuthGym as any).mockResolvedValue({
                userId: ownerId,
                gym: { id: gymId },
                role: 'OWNER'
            })
            ;(checkRole as any).mockReturnValue(null)

            mockPrisma.staffMember.findMany.mockResolvedValue([
                { id: 'staff-1', name: 'Member 1', role: 'TRAINER' }
            ] as any)

            const req = new NextRequest(`http://localhost/api/staff`)
            const res = await GET(req)
            const data = await res.json()

            expect(res.status).toBe(200)
            expect(data).toHaveLength(1)
            expect(mockPrisma.staffMember.findMany).toHaveBeenCalledWith(expect.objectContaining({
                where: { gymId }
            }))
        })

        it('should deny access if checkRole fails', async () => {
            ;(getAuthGym as any).mockResolvedValue({ userId: 'other' })
            ;(checkRole as any).mockReturnValue({ status: 403 }) // Simulate failure

            const req = new NextRequest(`http://localhost/api/staff`)
            const res = await GET(req)

            expect(res.status).toBe(403)
        })
    })

    describe('POST', () => {
        const validStaffData = {
            name: 'New Staff',
            email: 'new@staff.com',
            role: 'TRAINER'
        }

        it('should successfully create staff by owner', async () => {
            ;(getAuthGym as any).mockResolvedValue({
                userId: ownerId,
                gym: { id: gymId, name: 'Test Gym' },
                role: 'OWNER'
            })
            ;(checkRole as any).mockReturnValue(null)

            mockPrisma.staffMember.findFirst.mockResolvedValue(null)
            
            const mockSupabase = createAdminClient()
            ;(mockSupabase.auth.admin.createUser as any).mockResolvedValue({
                data: { user: { id: 'supabase-uid' } },
                error: null
            })

            mockPrisma.staffMember.create.mockResolvedValue({
                id: 'staff-new',
                ...validStaffData,
                gymId
            } as any)

            const req = new NextRequest(`http://localhost/api/staff`, {
                method: 'POST',
                body: JSON.stringify(validStaffData)
            })

            const res = await POST(req)
            const data = await res.json()

            expect(res.status).toBe(201)
            expect(data.id).toBe('staff-new')
            expect(mockPrisma.staffMember.create).toHaveBeenCalled()
        })

        it('should prevent MANAGER from creating another MANAGER', async () => {
            ;(getAuthGym as any).mockResolvedValue({
                userId: 'manager-1',
                gym: { id: gymId },
                role: 'MANAGER'
            })
            ;(checkRole as any).mockReturnValue(null)

            const req = new NextRequest(`http://localhost/api/staff`, {
                method: 'POST',
                body: JSON.stringify({ ...validStaffData, role: 'MANAGER' })
            })

            const res = await POST(req)
            const data = await res.json()

            expect(res.status).toBe(403)
            expect(data.error).toContain('Managers cannot create staff members with the MANAGER role')
        })

        it('should cleanup Supabase user if DB write fails', async () => {
             ;(getAuthGym as any).mockResolvedValue({
                userId: ownerId,
                gym: { id: gymId },
                role: 'OWNER'
            })
            ;(checkRole as any).mockReturnValue(null)

            mockPrisma.staffMember.findFirst.mockResolvedValue(null)
            
            const mockSupabase = createAdminClient()
            ;(mockSupabase.auth.admin.createUser as any).mockResolvedValue({
                data: { user: { id: 'supabase-uid' } },
                error: null
            })

            mockPrisma.staffMember.create.mockRejectedValue(new Error('DB Error'))

            const req = new NextRequest(`http://localhost/api/staff`, {
                method: 'POST',
                body: JSON.stringify(validStaffData)
            })

            const res = await POST(req)
            
            expect(res.status).toBe(500)
            expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('supabase-uid')
        })
    })
})
