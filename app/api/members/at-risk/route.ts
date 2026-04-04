import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const rl = await guardRateLimit(30, `${auth.userId}:members:at-risk`)
        if (rl) return rl

        const gym = auth.gym

        const url = new URL(req.url)
        const daysParam = url.searchParams.get('days')
        const parsedDays = daysParam ? parseInt(daysParam, 10) : 14
        const days = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 14

        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - days)
        cutoffDate.setHours(0, 0, 0, 0)

        // Find active members whose last attendance was before the cutoff date
        // or who have no attendance but their subscription started before the cutoff date
        const atRiskMembers = await prisma.member.findMany({
            where: {
                gymId: gym.id,
                status: 'ACTIVE',
                subscriptions: {
                    some: {
                        status: 'ACTIVE',
                        gymId: gym.id
                    }
                },
                OR: [
                    // Has attendance, but last one is older than cutoff
                    {
                        attendance: {
                            some: {} // Has at least one attendance
                        },
                        NOT: {
                            attendance: {
                                some: {
                                    date: { gte: cutoffDate }
                                }
                            }
                        }
                    },
                    // Has NO attendance, but joined/subscription started before cutoff
                    {
                        attendance: {
                            none: {}
                        },
                        subscriptions: {
                            some: {
                                status: 'ACTIVE',
                                startDate: { lt: cutoffDate }
                            }
                        }
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                phone: true,
                attendance: {
                    orderBy: { date: 'desc' },
                    take: 1,
                    select: { date: true }
                },
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    orderBy: { startDate: 'desc' },
                    select: { startDate: true },
                    take: 1
                }
            }
        })

        // Calculate exact days inactive
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const formattedMembers = atRiskMembers.map(member => {
            let lastVisit = null
            let daysInactive = days

            if (member.attendance.length > 0) {
                lastVisit = member.attendance[0].date
                const visitDate = new Date(lastVisit)
                visitDate.setHours(0, 0, 0, 0)
                daysInactive = Math.floor((today.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24))
            } else if (member.subscriptions.length > 0) {
                const startDate = new Date(member.subscriptions[0].startDate)
                startDate.setHours(0, 0, 0, 0)
                daysInactive = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            }

            return {
                id: member.id,
                name: member.name,
                phone: member.phone,
                lastVisit,
                daysInactive
            }
        })
        // Cap the window: if they haven't attended for more than (days + 30) days, they are considered 'zombies', not 'at risk'
        .filter(m => m.daysInactive <= days + 30)
        .sort((a, b) => a.daysInactive - b.daysInactive) // Sort by newly inactive first

        return NextResponse.json({
            count: formattedMembers.length,
            members: formattedMembers,
            daysThreshold: days
        })
    } catch (error) {
        console.error('At Risk API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch at-risk members' }, { status: 500 })
    }
}
