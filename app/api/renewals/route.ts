import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { addDays, subDays } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const rl = await guardRateLimit(30, `${auth.userId}:renewals:get`)
        if (rl) return rl

        const gym = auth.gym

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const plus30Days = addDays(today, 30)
        const minus30Days = subDays(today, 30)

        // Fetch subscriptions matching the criteria
        const subscriptions = await prisma.memberSubscription.findMany({
            where: {
                gymId: gym.id,
                // Only Active subscriptions going to expire, OR Expired subscriptions recently missed
                OR: [
                    {
                        status: 'ACTIVE',
                        endDate: {
                            gte: today,
                            lte: plus30Days
                        }
                    },
                    {
                        // Some gyms might mark them expired, so check status
                        endDate: {
                            gte: minus30Days,
                            lt: today
                        }
                    }
                ]
            },
            include: {
                member: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        status: true
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

        interface RenewalMember {
            id: string;
            memberId: string;
            memberName: string;
            phone: string | null;
            planName: string;
            endDate: Date;
            daysOffset: number;
        }

        const urgent: RenewalMember[] = []
        const upcoming: RenewalMember[] = []
        const missed: RenewalMember[] = []

        subscriptions.forEach(sub => {
            const endDate = new Date(sub.endDate)
            endDate.setHours(0, 0, 0, 0)

            const diffTime = endDate.getTime() - today.getTime()
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            const formattedSub = {
                id: sub.id,
                memberId: sub.member.id,
                memberName: sub.member.name,
                phone: sub.member.phone,
                planName: sub.plan.name,
                endDate: sub.endDate,
                daysOffset: diffDays // Negative means missed, positive means upcoming/urgent
            }

            if (diffDays < 0) {
                // Expired in the last 30 days
                missed.push(formattedSub)
            } else if (diffDays <= 7) {
                // Expiring within next 7 days
                urgent.push(formattedSub)
            } else {
                // Expiring between 8 and 30 days
                upcoming.push(formattedSub)
            }
        })

        // Sort missed inversely (most recently missed at the top)
        missed.sort((a, b) => b.daysOffset - a.daysOffset)

        return NextResponse.json({
            urgent,
            upcoming,
            missed,
            summary: {
                urgentCount: urgent.length,
                upcomingCount: upcoming.length,
                missedCount: missed.length
            }
        })

    } catch (error) {
        console.error('Renewals API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch renewals' }, { status: 500 })
    }
}
