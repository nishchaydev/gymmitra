import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, subMonths, format, startOfDay, subDays, endOfDay } from 'date-fns'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

async function getAuthenticatedGym() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    return await prisma.gymProfile.findUnique({ where: { userId: user.id } })
}

export async function GET(request: NextRequest) {
    try {
        const gym = await getAuthenticatedGym()
        if (!gym) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const searchParams = request.nextUrl.searchParams
        const type = searchParams.get('type')

        if (type === 'expiring') {
            // Get memberships expiring in the next 7 days
            const today = new Date()
            const nextWeek = new Date()
            nextWeek.setDate(today.getDate() + 7)

            const expiringSubscriptions = await prisma.memberSubscription.findMany({
                where: {
                    gymId: gym.id, // Security Check
                    endDate: {
                        gte: today,
                        lte: nextWeek
                    },
                    status: 'ACTIVE'
                },
                include: {
                    member: {
                        select: {
                            id: true,
                            name: true,
                            phone: true,
                            photo: true
                        }
                    },
                    plan: {
                        select: {
                            name: true
                        }
                    }
                },
                orderBy: {
                    endDate: 'asc'
                }
            })
            return NextResponse.json(expiringSubscriptions)
        }

        if (type === 'revenue') {
            // Get revenue for the last 6 months
            const revenueData = []
            for (let i = 5; i >= 0; i--) {
                const date = subMonths(new Date(), i)
                const start = startOfMonth(date)
                const nextMonth = startOfMonth(subMonths(new Date(), i - 1))

                // Aggregate Invoice totals
                const result = await prisma.invoice.aggregate({
                    _sum: {
                        total: true
                    },
                    where: {
                        gymId: gym.id, // Security Check
                        issueDate: {
                            gte: start,
                            lt: nextMonth
                        },
                        paymentStatus: 'PAID' // Only count paid invoices
                    }
                })

                revenueData.push({
                    name: format(date, 'MMM'),
                    total: Number(result._sum.total || 0)
                })
            }
            return NextResponse.json(revenueData)
        }

        if (type === 'attendance') {
            // Get attendance counts for the last 7 days
            const attendanceData = []
            for (let i = 6; i >= 0; i--) {
                const date = subDays(new Date(), i)
                const start = startOfDay(date)
                const end = endOfDay(date)

                const count = await prisma.attendance.count({
                    where: {
                        gymId: gym.id, // Security Check
                        checkInTime: {
                            gte: start,
                            lte: end
                        }
                    }
                })

                attendanceData.push({
                    name: format(date, 'EEE'), // Mon, Tue, etc.
                    total: count
                })
            }
            return NextResponse.json(attendanceData)
        }

        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })

    } catch (error) {
        console.error('Reports API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }
}
