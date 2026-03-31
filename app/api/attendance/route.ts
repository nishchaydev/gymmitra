import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthGym, checkRole } from '@/lib/auth'
import { apiLimiter } from '@/lib/rate-limit'
import { attendanceService } from '@/src/modules/attendance/service'

/**
 * Shared rate limit helper for attendance routes
 * Returns a NextResponse if limited, otherwise null
 */
async function checkAttendanceRateLimit(userId: string, limit: number = 100) {
    try {
        await apiLimiter.check(limit, `${userId}:attendance`)
        return null
    } catch (error: any) {
        if (error && typeof error === 'object' && 'retryAfter' in error && typeof error.retryAfter === 'number') {
            return NextResponse.json(
                { error: 'Too many requests', retryAfter: error.retryAfter },
                {
                    status: 429,
                    headers: { 'Retry-After': String(error.retryAfter) }
                }
            )
        }
        console.error('Rate limit check failed:', error)
        return NextResponse.json({ error: 'System busy, please try again' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = await getAuthGym()

        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const rateLimitResponse = await checkAttendanceRateLimit(auth.userId)
        if (rateLimitResponse) return rateLimitResponse

        const gym = auth.gym

        // STAFF, FRONT_DESK, and TRAINER can check in members
        const roleCheck = checkRole(auth, ['OWNER', 'MANAGER', 'STAFF', 'TRAINER', 'FRONT_DESK'])
        if (roleCheck) return roleCheck


        const body = await request.json()

        const ipHeader = request.headers.get('x-forwarded-for')
        const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

        const payload = await attendanceService.checkIn(gym.id, gym.timezone || 'Asia/Kolkata', body, auth.userId, ip)

        return NextResponse.json(payload, { status: 201 })
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
        }
        
        if (error.message.includes('Member or Staff not found') || error.message.includes('Check-in denied') || error.message.includes('already checked in today')) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        
        if (error.message.includes('Invalid timezone')) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        
        console.error('Error recording attendance:', error)
        return NextResponse.json({ error: 'Failed to record attendance. Please try again.' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthGym()

        if (!auth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const rateLimitResponse = await checkAttendanceRateLimit(auth.userId)
        if (rateLimitResponse) return rateLimitResponse

        const gym = auth.gym

        const { searchParams } = new URL(request.url)
        const memberId = searchParams.get('memberId')

        if (!memberId) {
            return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
        }

        const page = parseInt(searchParams.get('page') || '1', 10)
        const limitParam = parseInt(searchParams.get('limit') || '10', 10)
        const limit = Math.min(Math.max(limitParam, 1), 50)
        const skip = (page - 1) * limit

        const attendance = await attendanceService.getMemberAttendance(memberId, gym.id, skip, limit)

        return NextResponse.json(attendance)
    } catch (error: any) {
        if (error.message === 'Member not found or access denied') {
            return NextResponse.json({ error: error.message }, { status: 404 })
        }
        console.error('Error fetching attendance:', error)
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
    }
}
