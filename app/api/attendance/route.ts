import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { apiLimiter } from '@/lib/rate-limit'
import { cookies } from 'next/headers'

const checkInSchema = z.object({
    memberId: z.string().min(1, "Member ID is required"),
})

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Rate limit: 100 check-ins per minute per user
        try {
            await apiLimiter.check(100, user.id)
        } catch (error) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        }

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
            },
            include: { subscriptions: { where: { status: 'ACTIVE' } } }
        })

        if (!member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 })
        }

        if (member.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'Member is not active' }, { status: 400 })
        }

        const { startOfDay, endOfDay } = await import('date-fns')
        const now = new Date()

        const existingAttendance = await prisma.attendance.findFirst({
            where: {
                memberId,
                date: {
                    gte: startOfDay(now),
                    lte: endOfDay(now)
                }
            }
        })

        if (existingAttendance) {
            return NextResponse.json({ error: 'Member already checked in today' }, { status: 400 })
        }

        const attendance = await prisma.attendance.create({
            data: {
                memberId,
                gymId: gym.id,
                date: new Date(),
                checkInTime: new Date(),
            } as any
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

        // Rate limit: 100 requests per minute per user
        try {
            await apiLimiter.check(100, user.id)
        } catch (error) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
        }

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
            take: 10 // Last 10 records
        })

        return NextResponse.json(attendance)
    } catch (error) {
        console.error('Error fetching attendance:', error)
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
    }
}
