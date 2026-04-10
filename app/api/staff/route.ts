import { NextRequest, NextResponse } from 'next/server'
import { getAuthGym, checkRole } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { StaffService } from '@/src/modules/staff/service'
import { staffSchema } from '@/src/modules/staff/validator'

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const roleCheck = checkRole(auth, ['OWNER', 'MANAGER'])
        if (roleCheck) return roleCheck

        const rl = await guardRateLimit(50, `${auth.userId}:staff:get`)
        if (rl) return rl

        const staffMembers = await StaffService.listStaff(auth.gym.id)
        return NextResponse.json(staffMembers)
    } catch (error) {
        console.error('[Staff GET] Error:', error)
        return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const roleCheck = checkRole(auth, ['OWNER', 'MANAGER'])
        if (roleCheck) return roleCheck

        const rl = await guardRateLimit(10, `${auth.userId}:staff:post`)
        if (rl) return rl

        const body = await request.json()
        const result = staffSchema.safeParse(body)

        if (!result.success) {
            return NextResponse.json({ error: 'Validation failed', details: result.error.format() }, { status: 400 })
        }

        // Privilege escalation guard: a MANAGER cannot create another MANAGER
        if (auth.role === 'MANAGER' && result.data.role === 'MANAGER') {
            return NextResponse.json(
                { error: 'Managers cannot create staff members with the MANAGER role. Only the gym owner can do this.' },
                { status: 403 }
            )
        }

        const newStaff = await StaffService.createStaff(auth.gym, result.data)

        return NextResponse.json(
            { ...newStaff, tempPassword: undefined },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('[Staff POST] Error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create staff member' },
            { status: error.message?.includes('exists') ? 400 : 500 }
        )
    }
}
