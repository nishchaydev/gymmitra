import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfMonth, subMonths, format, startOfDay, subDays, endOfDay, eachMonthOfInterval } from 'date-fns'
import { getAuthGym, checkRole } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

async function getAuthenticatedGym() {
    const auth = await getAuthGym()
    if (!auth || !auth.gym || typeof auth.userId !== 'string') return null

    // Check role using standard helper
    const roleCheck = checkRole(auth, ['OWNER', 'ADMIN'])
    if (roleCheck) return null

    return auth
}

// ── Raw SQL row types ─────────────────────────────────────────────────────────

interface RevenueRow {
    month: string
    total: number
}

interface AttendanceRow {
    day: string
    count: bigint
}

interface ChurnRow {
    month: string
    churned: bigint
    total_active: bigint
}

interface RetentionRow {
    month: string
    renewed: bigint
    expired: bigint
}

interface MemberFrequencyRow {
    member_id: string
    member_name: string
    phone: string
    visit_count: bigint
    last_visit: string | null
}


export async function GET(request: NextRequest) {
    try {
        const auth = await getAuthenticatedGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const rl = await guardRateLimit(30, `${auth.userId}:reports:get`)
        if (rl) return rl

        const gym = auth.gym

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
            }).catch((err) => {
                console.error('Failed to fetch expiring subscriptions:', err);
                throw err;
            })
            return NextResponse.json(expiringSubscriptions)
        }

        if (type === 'revenue') {
            const startDate = startOfMonth(subMonths(new Date(), 5))

            // Raw SQL for efficient monthly aggregation
            const revenueResult = await (prisma.$queryRaw<RevenueRow[]>`
                SELECT 
                    to_char(date_trunc('month', "issueDate"), 'YYYY-MM-DD') as month,
                    SUM(total) as total
                FROM "Invoice"
                WHERE "gymId" = ${gym.id}
                  AND "issueDate" >= ${startDate}
                  AND "paymentStatus" = 'PAID'
                  AND "deletedAt" IS NULL
                GROUP BY 1
                ORDER BY 1 ASC
            `.catch((err) => {
                console.error('Failed to fetch revenue report data:', err);
                throw err;
            }))

            const interval = eachMonthOfInterval({
                start: startDate,
                end: new Date()
            })

            const revenueMap = new Map(
                interval.map(date => [format(date, 'yyyy-MM-01'), { name: format(date, 'MMM yyyy'), total: 0 }])
            )

            revenueResult.forEach(row => {
                const key = row.month
                if (revenueMap.has(key)) {
                    revenueMap.get(key)!.total = Number(row.total?.toString() || row.total || 0)
                }
            })

            const revenueData = Array.from(revenueMap.values())

            return NextResponse.json(revenueData)
        }

        if (type === 'attendance') {
            const today = endOfDay(new Date())
            const lastWeek = startOfDay(subDays(new Date(), 6))

            // Optimized single-query aggregation
            const attendanceResult = await (prisma.$queryRaw<AttendanceRow[]>`
                SELECT
                    to_char(date_trunc('day', "checkInTime"), 'YYYY-MM-DD') as day,
                    COUNT(*) as count
                FROM "Attendance"
                WHERE "gymId" = ${gym.id}
                  AND "checkInTime" >= ${lastWeek}
                  AND "checkInTime" <= ${today}
                GROUP BY 1
                ORDER BY 1 ASC
            `.catch((err) => {
                console.error('Failed to fetch attendance report data:', err);
                throw err;
            }))

            const attendanceMap = new Map<string, number>()
            attendanceResult.forEach(row => {
                attendanceMap.set(row.day, Number(row.count || 0))
            })

            const attendanceData = []
            for (let i = 6; i >= 0; i--) {
                const date = subDays(new Date(), i)
                const key = format(date, 'yyyy-MM-dd')
                attendanceData.push({
                    name: format(date, 'EEE'),
                    total: attendanceMap.get(key) || 0
                })
            }
            return NextResponse.json(attendanceData)
        }

        if (type === 'churn') {
            const startDate = startOfMonth(subMonths(new Date(), 5))

            // Improved Churn: Members whose status changed to INACTIVE/EXPIRED in that month
            const churnResult = await (prisma.$queryRaw<ChurnRow[]>`
                SELECT 
                    to_char(date_trunc('month', "churnedAt"), 'YYYY-MM-DD') as month,
                    COUNT(*) as churned,
                    (SELECT COUNT(*) FROM "Member" m2 WHERE m2."gymId" = ${gym.id} AND m2."createdAt" <= date_trunc('month', "churnedAt") + interval '1 month') as total_active
                FROM "Member"
                WHERE "gymId" = ${gym.id}
                    AND status IN ('INACTIVE', 'EXPIRED')
                    AND "churnedAt" IS NOT NULL
                    AND "churnedAt" >= ${startDate}
                GROUP BY 1
                ORDER BY 1 ASC
            `.catch((err) => {
                console.error('Failed to fetch churn report data:', err);
                throw err;
            }))

            const interval = eachMonthOfInterval({ start: startDate, end: new Date() })
            const churnMap = new Map<string, { name: string, churnRate: number | null }>(
                interval.map(date => [format(date, 'yyyy-MM-01'), { name: format(date, 'MMM yyyy'), churnRate: 0 }])
            )

            churnResult.forEach(row => {
                const key = row.month
                if (churnMap.has(key)) {
                    const churned = Number(row.churned || 0)
                    const totalActive = Number(row.total_active || 0)
                    const rate = totalActive > 0 ? Math.min(100, Math.round((churned / totalActive) * 100)) : null
                    churnMap.get(key)!.churnRate = rate
                }
            })

            return NextResponse.json(Array.from(churnMap.values()))
        }

        if (type === 'retention') {
            const startDate = startOfMonth(subMonths(new Date(), 5))

            const retentionResult = await (prisma.$queryRaw<RetentionRow[]>`
                SELECT 
                    to_char(date_trunc('month', "endDate"), 'YYYY-MM-DD') as month,
                    SUM(CASE WHEN "status" = 'ACTIVE' THEN 1 ELSE 0 END) as renewed,
                    SUM(CASE WHEN "status" = 'EXPIRED' THEN 1 ELSE 0 END) as expired
                FROM "MemberSubscription"
                WHERE "gymId" = ${gym.id}
                  AND "endDate" >= ${startDate}
                  AND "endDate" <= ${new Date()}
                GROUP BY 1
                ORDER BY 1 ASC
            `.catch((err) => {
                console.error('Failed to fetch retention report data:', err);
                throw err;
            }))

            const interval = eachMonthOfInterval({ start: startDate, end: new Date() })
            const retentionMap = new Map(
                interval.map(date => [format(date, 'yyyy-MM-01'), { name: format(date, 'MMM yyyy'), retentionRate: 100 }])
            )

            retentionResult.forEach(row => {
                const key = row.month
                if (retentionMap.has(key)) {
                    const renewed = Number(row.renewed || 0)
                    const expired = Number(row.expired || 0)
                    const total = renewed + expired
                    const rate = total > 0 ? Math.round((renewed / total) * 100) : 100
                    retentionMap.get(key)!.retentionRate = rate
                }
            })

            return NextResponse.json(Array.from(retentionMap.values()))
        }

        if (type === 'member-frequency') {
            const thirtyDaysAgo = startOfDay(subDays(new Date(), 30))

            const frequencyResult = await (prisma.$queryRaw<MemberFrequencyRow[]>`
                SELECT 
                    m.id as member_id,
                    m.name as member_name,
                    m.phone,
                    COUNT(a.id) as visit_count,
                    MAX(a.date) as last_visit
                FROM "Member" m
                LEFT JOIN "Attendance" a ON m.id = a."memberId" AND a.date >= ${thirtyDaysAgo}
                WHERE m."gymId" = ${gym.id}
                  AND m.status = 'ACTIVE'
                GROUP BY m.id
                ORDER BY visit_count DESC, last_visit DESC NULLS FIRST
                LIMIT 50
            `.catch((err) => {
                console.error('Failed to fetch member frequency report data:', err);
                throw err;
            }))

            return NextResponse.json(frequencyResult.map(row => ({
                memberId: row.member_id,
                memberName: row.member_name,
                phone: row.phone ? row.phone.replace(/(\d{2})(\d+)(\d{4})/, "$1******$3") : null,
                visitCount: Number(row.visit_count || 0),
                lastVisit: row.last_visit ? format(new Date(row.last_visit), 'yyyy-MM-dd') : null
            })))
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
                    where: { gymId: gym.id, paymentStatus: 'PAID', deletedAt: null },
                    _sum: { total: true }
                }).catch((err) => { console.error('Failed to fetch totalRevenue:', err); return { _sum: { total: null } } }),
                prisma.member.count({
                    where: {
                        gymId: gym.id,
                        NOT: { name: { contains: 'Seed', mode: 'insensitive' as any } }
                    }
                }).catch((err) => { console.error('Failed to fetch totalMembers:', err); return 0 }),
                prisma.member.count({
                    where: {
                        gymId: gym.id,
                        status: 'ACTIVE',
                        NOT: { name: { contains: 'Seed', mode: 'insensitive' as any } }
                    }
                }).catch((err) => { console.error('Failed to fetch activeMembers:', err); return 0 }),
                prisma.product.count({ where: { gymId: gym.id, isActive: true } }).catch((err) => { console.error('Failed to fetch totalProducts:', err); return 0 }),
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
                }).catch((err) => {
                    console.error('Failed to fetch summary data (recentSales):', err);
                    return []; // Only recent sales is allowed to be empty for summary
                })
            ])

            return NextResponse.json({
                totalRevenue: Number(totalRevenue._sum.total?.toString() || totalRevenue._sum.total || 0),
                totalMembers: Number(totalMembers || 0),
                activeMembers: Number(activeMembers || 0),
                totalProducts: Number(totalProducts || 0),
                recentSales: (recentSales as any[]).map(s => ({
                    ...s,
                    finalAmount: Number(s.finalAmount?.toString() || s.finalAmount || 0),
                    productName: s.product?.name || 'Unknown',
                    category: s.product?.category || 'Uncategorized',
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
