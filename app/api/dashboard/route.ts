import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { startOfToday, endOfToday, subMonths, startOfMonth, endOfMonth, addDays } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const rl = await guardRateLimit(30, `${auth.userId}:dashboard:get`)
        if (rl) return rl

        const gym = auth.gym
        const today = startOfToday()

        const startOfThisMonth = startOfMonth(today)
        const startOfLastMonth = startOfMonth(subMonths(today, 1))
        const endOfLastMonth = endOfMonth(subMonths(today, 1))

        const [
            totalMembers,
            activeMembers,
            productSalesCount,
            dailyCheckins,
            invoices,
            attendance,
            birthdays,
            monthlyRevenue,
            thisMonthInvoicesPaid,
            thisMonthInvoicesPending,
            lastMonthInvoicesPaid,
            outstandingInvoices,
            urgentCount,
            birthdaysToday,
            totalExpensesResult,
        ] = await Promise.all([
            prisma.member.count({
                where: {
                    gymId: gym.id,
                    NOT: { name: { contains: 'Seed', mode: 'insensitive' as any } }
                }
            }).catch(() => 0),
            prisma.member.count({
                where: {
                    gymId: gym.id,
                    status: 'ACTIVE',
                    NOT: { name: { contains: 'Seed', mode: 'insensitive' as any } }
                }
            }).catch(() => 0),
            prisma.sale.count({ where: { product: { gymId: gym.id }, saleDate: { gte: startOfThisMonth } } }).catch(() => 0),
            prisma.attendance.count({
                where: {
                    gymId: gym.id,
                    date: { gte: today, lte: endOfToday() },
                },
            }).catch(() => 0),
            prisma.invoice.findMany({
                where: { gymId: gym.id },
                include: { member: { select: { name: true } } },
                orderBy: { createdAt: 'desc' },
                take: 5,
            }).catch(() => []),
            prisma.attendance.findMany({
                where: { gymId: gym.id, date: { gte: today, lte: endOfToday() } },
                include: { member: { select: { name: true } } },
                orderBy: { checkInTime: 'desc' },
                take: 3,
            }).catch(() => []),
            prisma.member.findMany({
                where: {
                    gymId: gym.id,
                    status: 'ACTIVE',
                    NOT: { name: { contains: 'Seed', mode: 'insensitive' as any } }
                },
                select: { name: true, phone: true, dateOfBirth: true },
                take: 50,
            }).catch(() => []),
             (prisma.$queryRaw`
                 SELECT
                     EXTRACT(YEAR FROM "issueDate")::int AS year,
                     EXTRACT(MONTH FROM "issueDate")::int AS month,
                     COALESCE(SUM("total"), 0) AS total
                 FROM "Invoice"
                 WHERE "gymId" = ${gym.id}
                     AND "paymentStatus" = 'PAID'
                     AND "deletedAt" IS NULL
                 GROUP BY year, month
                 ORDER BY year DESC, month ASC
             ` as Promise<{ year: number; month: number; total: any }[]>).catch(() => []),
            prisma.invoice.aggregate({
                where: {
                    gymId: gym.id,
                    paymentStatus: 'PAID',
                    issueDate: { gte: startOfThisMonth },
                    deletedAt: null
                },
                _sum: { total: true }
            }).catch(() => ({ _sum: { total: null } })),
            prisma.invoice.aggregate({
                where: {
                    gymId: gym.id,
                    paymentStatus: 'PENDING',
                    issueDate: { gte: startOfThisMonth },
                    deletedAt: null
                },
                _sum: { total: true }
            }).catch(() => ({ _sum: { total: null } })),
            prisma.invoice.aggregate({
                where: {
                    gymId: gym.id,
                    paymentStatus: 'PAID',
                    issueDate: { gte: startOfLastMonth, lte: endOfLastMonth },
                    deletedAt: null
                },
                _sum: { total: true }
            }).catch(() => ({ _sum: { total: null } })),
            prisma.invoice.findMany({
                where: {
                    gymId: gym.id,
                    paymentStatus: { in: ['PARTIAL', 'PENDING'] },
                    deletedAt: null
                },
                include: { member: { select: { name: true, phone: true } } },
                orderBy: { issueDate: 'asc' },
                take: 5
            }).catch(() => []),
            prisma.memberSubscription.count({
                where: {
                    gymId: gym.id,
                    endDate: { gte: today, lte: addDays(today, 3) },
                    status: 'ACTIVE'
                }
            }).catch(() => 0),
             prisma.member.findMany({
                where: {
                    gymId: gym.id,
                    status: 'ACTIVE'
                },
                select: { dateOfBirth: true }
            }).catch(() => []),
            // Handle case where Expense model/table might not exist
            (async (): Promise<{ _sum: { amount: number | null } }> => {
                try {
                    const result = await prisma.expense.aggregate({
                        where: { gymId: gym.id, date: { gte: startOfThisMonth } },
                        _sum: { amount: true }
                    });
                    return { _sum: { amount: result._sum.amount ? Number(result._sum.amount) : null } };
                } catch (error) {
                    // Expense table/model might not exist yet
                    console.warn('Expense table not available:', (error as Error).message);
                    return { _sum: { amount: null } };
                }
            })()
        ])

        const birthdayCount = birthdaysToday.filter((m: any) => {
            if (!m.dateOfBirth) return false
            const dobString = typeof m.dateOfBirth === 'string' ? m.dateOfBirth : m.dateOfBirth.toISOString()
            const [, month, day] = dobString.split('T')[0].split('-').map(Number)
            return day === today.getDate() && month === today.getMonth() + 1
        }).length

        // Process revenue
        const thisMonthRevenue = Number(thisMonthInvoicesPaid._sum.total || 0)
        const lastMonthRevenue = Number(lastMonthInvoicesPaid._sum.total || 0)
        const pendingRevenue = Number(thisMonthInvoicesPending._sum.total || 0)

        let revenueChange = 0;
        if (lastMonthRevenue > 0) {
            revenueChange = ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
        } else if (lastMonthRevenue === 0 && thisMonthRevenue > 0) {
            revenueChange = 100;
        }

        // Process attendance widget
        let todayAttendance = {
            count: dailyCheckins || 0,
            recentInitials: [] as string[],
            lastCheckinLabel: 'No check-ins today',
        }
        if (attendance.length > 0) {
            const last = attendance[0]
            const checkIn = new Date(last.checkInTime)
            const minutesAgo = Math.max(0, Math.round((Date.now() - checkIn.getTime()) / 60000))
            todayAttendance = {
                count: dailyCheckins,
                lastCheckinLabel:
                    minutesAgo < 60
                        ? `Last check-in ${minutesAgo} min${minutesAgo !== 1 ? 's' : ''} ago`
                        : `Last check-in ${Math.round(minutesAgo / 60)}h ago`,
                recentInitials: attendance.map((a: any) => {
                    const name = a.member?.name?.trim()
                    if (!name) return '?'
                    return name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
                }),
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
                const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
                if (next < today) next.setFullYear(today.getFullYear() + 1)
                const diffDays = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                const label = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `${dob.getDate()} ${monthNames[dob.getMonth()]}`
                return { ...m, date: label, diffDays }
            })
            .filter((m: any): m is NonNullable<typeof m> => m !== null)
            .sort((a: any, b: any) => a.diffDays - b.diffDays)
            .slice(0, 5)

         // Process monthly revenue chart - now includes year data
         const monthlyRevenueData: { name: string; total: number }[] = []
         if (monthlyRevenue && Array.isArray(monthlyRevenue)) {
             // Group by year-month for proper historical data
             const revenueMap = new Map<string, number>()
             
             for (const row of monthlyRevenue) {
                 const year = Number(row.year)
                 const month = Number(row.month)
                 const total = Number(row.total?.toString() || row.total || 0)
                 
                 if (!isNaN(year) && !isNaN(month)) {
                     // Create key like "2024-01" for Jan 2024
                     const key = `${year}-${month.toString().padStart(2, '0')}`
                     revenueMap.set(key, (revenueMap.get(key) || 0) + total)
                 }
             }
             
             // Convert to format expected by chart: last 12 months
             const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
             for (let i = 11; i >= 0; i--) {
                 const date = subMonths(startOfToday(), i)
                 const year = date.getFullYear()
                 const month = date.getMonth() + 1 // JS months are 0-indexed
                 const key = `${year}-${month.toString().padStart(2, '0')}`
                 const total = revenueMap.get(key) || 0
                 
                 monthlyRevenueData.push({
                     name: monthNames[month - 1],
                     total: total
                 })
             }
         }

        return NextResponse.json({
            totalMembers,
            activeMembers,
            revenue: thisMonthRevenue.toLocaleString('en-IN'),
            revenueRaw: thisMonthRevenue,
            lastMonthRevenue,
            revenueChange: Number(revenueChange.toFixed(2)),
            pendingRevenue,
            productSalesCount,
            dailyCheckins: dailyCheckins || 0,
            recentInvoices: invoices,
            todayAttendance,
            upcomingBirthdays,
            monthlyRevenueData,
            outstandingInvoices,
            urgentCount,
            birthdayCount,
            totalExpenses: Number(totalExpensesResult?._sum?.amount || 0),
        })
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        console.error(JSON.stringify({
            route: 'dashboard',
            action: 'fetch',
            errorName: err.name,
            errorMessage: err.message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
        }))
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }
}
