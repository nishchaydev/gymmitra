import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { addDays, startOfDay, endOfDay } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const rl = await guardRateLimit(30, `${auth.userId}:dashboard:expiring`)
        if (rl) return rl

        const gym = auth.gym
        const today = new Date()
        const start = startOfDay(today)
        const end = addDays(endOfDay(today), 30) // Next 30 days

        const expiringMembers = await prisma.memberSubscription.findMany({
            where: {
                gymId: gym.id,
                status: 'ACTIVE',
                endDate: {
                    gte: start,
                    lte: end
                }
            },
            include: {
                member: {
                    select: {
                        id: true,
                        name: true,
                        phone: true
                    }
                }
            },
            orderBy: {
                endDate: 'asc'
            }
        })

        const formatted = expiringMembers.map(sub => {
            const diffTime = sub.endDate.getTime() - today.getTime();
            const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 3600 * 24)));

            return {
                id: sub.member.id,
                name: sub.member.name,
                phone: sub.member.phone,
                endDate: sub.endDate,
                daysLeft,
                planName: sub.planName || 'Active Plan'
            }
        })

        return NextResponse.json({
            count: formatted.length,
            members: formatted
        })
    } catch (error) {
        console.error('Expiring Members API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch expiring members' }, { status: 500 })
    }
}
