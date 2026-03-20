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

        const expiringSubscriptions = await prisma.memberSubscription.findMany({
            where: {
                gymId: gym.id,
                status: 'ACTIVE',
                endDate: {
                    gte: start,
                    lte: end,
                },
            },
            include: {
                member: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        status: true,
                    },
                },
                plan: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                endDate: 'asc',
            },
        })

        const formattedSubscriptions = expiringSubscriptions.map((sub: any) => ({
            id: sub.id,
            memberName: sub.member.name,
            memberEmail: sub.member.email,
            endDate: sub.endDate.toISOString(),
            planName: sub.plan.name,
            daysLeft: Math.ceil((sub.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        }))

        return NextResponse.json({
            count: formattedSubscriptions.length,
            members: formattedSubscriptions
        })
    } catch (error) {
        console.error('Expiring Members API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch expiring members' }, { status: 500 })
    }
}
