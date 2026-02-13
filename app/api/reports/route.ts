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
            // Get revenue for the last 6 months using a single grouped query
            const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5))

            // Group by month (truncating date to month start)
            // Note: Prisma doesn't support complex date grouping natively easily with SQLite/Postgres differences 
            // without raw queries, but for now we'll fetch the range and group in memory 
            // OR use groupBy if strictly on Postgres with appropriate date functions.
            // Since we want to stick to Prisma standard features where possible or use raw for performance:

            // Using findMany and aggregating in code is better than N+1, but typical efficient way:
            const invoices = await prisma.invoice.groupBy({
                by: ['issueDate'],
                _sum: {
                    total: true
                },
                where: {
                    gymId: gym.id,
                    issueDate: {
                        gte: sixMonthsAgo
                    },
                    paymentStatus: 'PAID'
                }
            })

            // Post-process to group by month
            const monthlyRevenue = new Map<string, number>()

            // Initialize last 6 months with 0
            for (let i = 5; i >= 0; i--) {
                const date = subMonths(new Date(), i)
                const monthKey = format(date, 'MMM')
                monthlyRevenue.set(monthKey, 0)
            }

            invoices.forEach(inv => {
                const month = format(inv.issueDate, 'MMM')
                if (monthlyRevenue.has(month)) {
                    monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + (Number(inv._sum.total) || 0))
                }
            })

            const revenueData = Array.from(monthlyRevenue.entries()).map(([name, total]) => ({
                name,
                total
            }))

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

        // Default: Dashboard Summary (if no type or type='summary')
        if (!type || type === 'summary') {
            const [
                totalRevenue,
                totalMembers,
                activeMembers,
                totalProducts,
                recentSales
            ] = await Promise.all([
                prisma.invoice.aggregate({
                    where: {
                        gymId: gym.id,
                        paymentStatus: 'PAID'
                    },
                    _sum: { total: true }
                }),
                prisma.member.count({
                    where: { gymId: gym.id }
                }),
                prisma.member.count({
                    where: {
                        gymId: gym.id,
                        status: 'ACTIVE'
                    }
                }),
                prisma.product.count({
                    where: {
                        gymId: gym.id,
                        isActive: true
                    }
                }),
                prisma.sale.findMany({
                    where: { gymId: gym.id },
                    take: 10,
                    orderBy: { saleDate: 'desc' },
                    include: {
                        product: true,
                        member: true
                    }
                })
            ])

            return NextResponse.json({
                totalRevenue: Number(totalRevenue._sum.total || 0),
                totalMembers,
                activeMembers,
                totalProducts,
                recentSales
            })
        }

        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })

    } catch (error) {
        console.error('Reports API Error:', {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined, // Log stack for debugging
            type: request.nextUrl.searchParams.get('type')
        })
        return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }
}
