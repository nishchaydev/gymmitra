import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { startOfToday, endOfToday } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const rl = await guardRateLimit(30, `${auth.userId}:dashboard:get`)
        if (rl) return rl

        const gym = auth.gym
        const today = startOfToday()

        const [
            totalMembers,
            activeMembers,
            totalRevenue,
            productSalesCount,
            dailyCheckins,
            invoices,
            attendance,
            birthdays,
            monthlyRevenue,
        ] = await Promise.all([
            prisma.member.count({ where: { gymId: gym.id } as any }),
            prisma.member.count({ where: { gymId: gym.id, status: 'ACTIVE' } as any }),
            prisma.invoice.aggregate({
                where: { paymentStatus: 'PAID', gymId: gym.id } as any,
                _sum: { total: true },
            }),
            prisma.sale.count({ where: { product: { gymId: gym.id } } as any }),
            prisma.attendance.count({
                where: {
                    gymId: gym.id,
                    date: { gte: today, lte: endOfToday() },
                } as any,
            }),
            prisma.invoice.findMany({
                where: { gymId: gym.id } as any,
                include: { member: { select: { name: true } } } as any,
                orderBy: { createdAt: 'desc' } as any,
                take: 5,
            }),
            prisma.attendance.findMany({
                where: { gymId: gym.id, date: { gte: today, lte: endOfToday() } } as any,
                include: { member: { select: { name: true } } },
                orderBy: { checkInTime: 'desc' },
                take: 3,
            }),
            prisma.member.findMany({
                where: { gymId: gym.id, status: 'ACTIVE' },
                select: { name: true, phone: true, dateOfBirth: true },
                take: 50,
            }),
            prisma.$queryRaw`
                SELECT
                    EXTRACT(MONTH FROM "createdAt")::int AS month,
                    COALESCE(SUM("total"), 0) AS total
                FROM "Invoice"
                WHERE "gymId" = ${gym.id}
                    AND "paymentStatus" = 'PAID'
                    AND EXTRACT(YEAR FROM "createdAt") = EXTRACT(YEAR FROM NOW())
                    AND "deletedAt" IS NULL
                GROUP BY month
                ORDER BY month
            ` as Promise<{ month: number; total: any }[]>,
        ])

        // Process revenue
        const revenue = Number((totalRevenue as any)._sum.total || 0)

        // Process attendance widget
        let todayAttendance = {
            count: dailyCheckins || 0,
            recentInitials: [] as string[],
            lastCheckinLabel: 'No check-ins today',
        }
        if (attendance.length > 0) {
            const last = attendance[0]
            const checkIn = new Date((last as any).checkInTime)
            const minutesAgo = Math.max(0, Math.round((Date.now() - checkIn.getTime()) / 60000))
            todayAttendance = {
                count: dailyCheckins,
                lastCheckinLabel:
                    minutesAgo < 60
                        ? `Last check-in ${minutesAgo} min${minutesAgo !== 1 ? 's' : ''} ago`
                        : `Last check-in ${Math.round(minutesAgo / 60)}h ago`,
                recentInitials: attendance.map((a: any) =>
                    a.member?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) ?? '?'
                ),
            }
        }

        // Process birthdays
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const upcomingBirthdays = birthdays
            .map((m: any) => {
                const dobString = typeof m.dateOfBirth === 'string' ? m.dateOfBirth : m.dateOfBirth?.toISOString()
                if (!dobString) return null
                const [year, month, day] = dobString.split('T')[0].split('-').map(Number)
                const dob = new Date(year, month - 1, day)
                let next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
                if (next < today) next.setFullYear(today.getFullYear() + 1)
                const diffDays = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                const label = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `${dob.getDate()} ${monthNames[dob.getMonth()]}`
                return { ...m, date: label, diffDays }
            })
            .filter(Boolean)
            .sort((a: any, b: any) => a.diffDays - b.diffDays)
            .slice(0, 5)

        // Process monthly revenue chart
        let monthlyRevenueData: { name: string; total: number }[] = []
        if (monthlyRevenue && monthlyRevenue.length > 0) {
            const revenueMap = new Map<number, number>()
            for (const row of monthlyRevenue) {
                revenueMap.set(row.month, Number(row.total) || 0)
            }
            monthlyRevenueData = monthNames.map((name, i) => ({
                name,
                total: revenueMap.get(i + 1) || 0,
            }))
        }

        return NextResponse.json({
            totalMembers,
            activeMembers,
            revenue: revenue.toLocaleString('en-IN'),
            revenueRaw: revenue,
            productSalesCount,
            dailyCheckins: dailyCheckins || 0,
            recentInvoices: invoices,
            todayAttendance,
            upcomingBirthdays,
            monthlyRevenueData,
        })
    } catch (error) {
        console.error('Dashboard API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }
}
