import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, subMonths, format, startOfDay, subDays, endOfDay, eachMonthOfInterval } from 'date-fns'
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
            const today = new Date()
            const nextWeek = new Date()
            nextWeek.setDate(today.getDate() + 7)

            const expiringSubscriptions = await prisma.memberSubscription.findMany({
                where: {
                    gymId: gym.id,
                    endDate: { gte: today, lte: nextWeek },
                    status: 'ACTIVE'
                },
                select: {
                    id: true,
                    endDate: true,
                    status: true,
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
                orderBy: { endDate: 'asc' }
            })
            return NextResponse.json(expiringSubscriptions)
        }

        if (type === 'revenue') {
            const startDate = startOfMonth(subMonths(new Date(), 5))

            // Raw SQL for efficient monthly aggregation
            const revenueResult = await prisma.$queryRaw`
                SELECT 
                    date_trunc('month', "issueDate") as month,
                    SUM(total) as total
                FROM "Invoice"
                WHERE "gymId" = ${gym.id}
                  AND "issueDate" >= ${startDate}
                  AND "paymentStatus" = 'PAID'
                GROUP BY 1
                ORDER BY 1 ASC
            ` as any[]

            const interval = eachMonthOfInterval({
                start: startDate,
                end: new Date()
            })

            const revenueMap = new Map(
                interval.map(date => [format(date, 'MMM yyyy'), 0])
            )

            revenueResult.forEach(row => {
                const key = format(new Date(row.month), 'MMM yyyy')
                if (revenueMap.has(key)) {
                    revenueMap.set(key, Number(row.total || 0))
                }
            })

            const revenueData = Array.from(revenueMap.entries()).map(([name, total]) => ({
                name,
                total
            }))

            return NextResponse.json(revenueData)
        }

        if (type === 'attendance') {
            const attendanceData = []
            for (let i = 6; i >= 0; i--) {
                const date = subDays(new Date(), i)
                const start = startOfDay(date)
                const end = endOfDay(date)

                const count = await prisma.attendance.count({
                    where: {
                        gymId: gym.id,
                        checkInTime: { gte: start, lte: end }
                    }
                })

                attendanceData.push({
                    name: format(date, 'EEE'),
                    total: count
                })
            }
            return NextResponse.json(attendanceData)
        }

        if (!type || type === 'summary') {
            const [
                totalRevenue,
                totalMembers,
                activeMembers,
                totalProducts,
                recentSales
            ] = await Promise.all([
                prisma.invoice.aggregate({
                    where: { gymId: gym.id, paymentStatus: 'PAID' },
                    _sum: { total: true }
                }),
                prisma.member.count({ where: { gymId: gym.id } }),
                prisma.member.count({ where: { gymId: gym.id, status: 'ACTIVE' } }),
                prisma.product.count({ where: { gymId: gym.id, isActive: true } }),
                prisma.sale.findMany({
                    where: { gymId: gym.id },
                    take: 10,
                    orderBy: { saleDate: 'desc' },
                    select: {
                        id: true,
                        quantity: true,
                        finalAmount: true,
                        saleDate: true,
                        product: { select: { name: true, category: true } },
                        member: { select: { name: true } }
                    }
                })
            ])

            return NextResponse.json({
                totalRevenue: Number(totalRevenue._sum.total || 0),
                totalMembers,
                activeMembers,
                totalProducts,
                recentSales: recentSales.map(s => ({
                    ...s,
                    productName: s.product.name,
                    category: s.product.category,
                    memberName: s.member?.name || 'Walk-in'
                }))
            })
        }

        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })

    } catch (error) {
        console.error('Reports API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }
}
