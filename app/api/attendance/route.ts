import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const checkInSchema = z.object({
    memberId: z.string().min(1, "Member ID is required"),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { memberId } = checkInSchema.parse(body)

        // Check if member exists
        const member = await prisma.member.findUnique({
            where: { id: memberId },
            include: { subscriptions: { where: { status: 'ACTIVE' } } }
        })

        if (!member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 })
        }

        if (member.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'Member is not active' }, { status: 400 })
        }

        // Check for existing check-in today
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date()
        endOfDay.setHours(23, 59, 59, 999)

        const existingAttendance = await prisma.attendance.findFirst({
            where: {
                memberId,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            }
        })

        if (existingAttendance) {
            return NextResponse.json({ error: 'Member already checked in today' }, { status: 400 })
        }

        // Create attendance record
        const attendance = await prisma.attendance.create({
            data: {
                memberId,
                date: new Date(),
                checkInTime: new Date(),
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
        const { searchParams } = new URL(request.url)
        const memberId = searchParams.get('memberId')

        if (!memberId) {
            return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
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
