import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { apiLimiter } from '@/lib/rate-limit'
import { startOfDay, endOfDay } from 'date-fns'

const checkInSchema = z.object({
    memberId: z.string().min(1, "Member ID is required"),
})

/**
 * Shared rate limit helper for attendance routes
 * Returns a NextResponse if limited, otherwise null
 */
async function checkAttendanceRateLimit(userId: string, limit: number = 100) {
    try {
        await apiLimiter.check(limit, `${userId}:attendance`)
        return null
    } catch (error: unknown) {
        // Distinguish between RateLimitError (if we had one) or generic error with retryAfter
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
        // Fail open if rate limit check fails systemically, or return 500?
        // Usually safer to fail open for attendance unless strict, but here we return 500 to be safe.
        return NextResponse.json({ error: 'System busy, please try again' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const now = new Date() // Unified timestamp for consistency
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const rateLimitResponse = await checkAttendanceRateLimit(user.id)
        if (rateLimitResponse) return rateLimitResponse

        const gym = await prisma.gymProfile.findUnique({
            where: { userId: user.id }
        })

        if (!gym) {
            return NextResponse.json({ error: 'Gym profile not found' }, { status: 404 })
        }

        const body = await request.json()
        const { memberId } = checkInSchema.parse(body)

        // Check if member exists AND belongs to gym
        const member = await prisma.member.findFirst({
            where: {
                id: memberId,
                gymId: gym.id // Enforce ownership
            }
        })

        if (!member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 })
        }

        if (member.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'Member is not active' }, { status: 400 })
        }

        const startOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const endOfTodayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

        const existingAttendance = await prisma.attendance.findFirst({
            where: {
                memberId,
                date: {
                    gte: startOfTodayUTC,
                    lte: endOfTodayUTC
                }
            }
        })

        if (existingAttendance) {
            return NextResponse.json({ error: 'Member already checked in today' }, { status: 400 })
        }

        const attendance = await prisma.attendance.create({
            data: {
                member: { connect: { id: memberId } },
                gym: { connect: { id: gym.id } },
                date: now,
                checkInTime: now,
            }
        })

        return NextResponse.json(attendance, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Validation failed', details: error.issues }, { status: 400 })
        }
        console.error('Error recording attendance:', error)
        return NextResponse.json({ error: 'Failed to record attendance' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const rateLimitResponse = await checkAttendanceRateLimit(user.id)
        if (rateLimitResponse) return rateLimitResponse

        const gym = await prisma.gymProfile.findUnique({
            where: { userId: user.id }
        })

        if (!gym) {
            return NextResponse.json({ error: 'Gym profile not found' }, { status: 404 })
        }

        const { searchParams } = new URL(request.url)
        const memberId = searchParams.get('memberId')

        if (!memberId) {
            return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
        }

        const page = parseInt(searchParams.get('page') || '1', 10)
        const limitParam = parseInt(searchParams.get('limit') || '10', 10)
        const limit = Math.min(Math.max(limitParam, 1), 50)
        const skip = (page - 1) * limit

        // Verify member belongs to this gym
        const member = await prisma.member.findFirst({
            where: { id: memberId, gymId: gym.id }
        })

        if (!member) {
            return NextResponse.json({ error: 'Member not found or access denied' }, { status: 404 })
        }

        const attendance = await prisma.attendance.findMany({
            where: { memberId },
            orderBy: { date: 'desc' },
            skip,
            take: limit
        })

        return NextResponse.json(attendance)
    } catch (error) {
        console.error('Error fetching attendance:', error)
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
    }
}
