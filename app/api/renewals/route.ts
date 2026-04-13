import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { guardRateLimit } from '@/lib/rate-limit'
import { addDays, subDays } from 'date-fns'
import { getOrFetch, cacheKey, CACHE_TTL } from '@/lib/redis-cache'

export const dynamic = 'force-dynamic'

interface RenewalMember {
    id: string
    memberId: string
    memberName: string
    phone: string | null
    planName: string
    endDate: Date
    daysOffset: number
}

export async function GET() {
    try {
        const auth = await getAuthGym()
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const rl = await guardRateLimit(30, `${auth.userId}:renewals:get`)
        if (rl) return rl

        const gym = auth.gym

        // ── Redis-First ───────────────────────────────────────────────────
        const { data, fromCache } = await getOrFetch(
            cacheKey.renewals(gym.id),
            CACHE_TTL.RENEWALS,
            async () => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const plus30Days = addDays(today, 30)
                const minus30Days = subDays(today, 30)

                const subscriptions = await prisma.memberSubscription.findMany({
                    where: {
                        gymId: gym.id,
                        member: { deletedAt: null },
                        OR: [
                            { status: 'ACTIVE', endDate: { gte: today, lte: plus30Days } },
                            { endDate: { gte: minus30Days, lt: today } },
                        ],
                    },
                    include: {
                        member: { select: { id: true, name: true, phone: true, status: true } },
                        plan: { select: { name: true } },
                    },
                    orderBy: { endDate: 'asc' },
                })

                const urgent: RenewalMember[] = []
                const upcoming: RenewalMember[] = []
                const missed: RenewalMember[] = []

                subscriptions.forEach(sub => {
                    const endDate = new Date(sub.endDate)
                    endDate.setHours(0, 0, 0, 0)
                    const diffDays = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                    const formatted: RenewalMember = {
                        id: sub.id,
                        memberId: sub.member?.id || 'unknown',
                        memberName: sub.member?.name || 'Unknown Member',
                        phone: sub.member?.phone || null,
                        planName: sub.plan?.name || 'Unknown Plan',
                        endDate: sub.endDate,
                        daysOffset: diffDays,
                    }

                    if (diffDays < 0) missed.push(formatted)
                    else if (diffDays <= 7) urgent.push(formatted)
                    else upcoming.push(formatted)
                })

                missed.sort((a, b) => b.daysOffset - a.daysOffset)

                return {
                    urgent,
                    upcoming,
                    missed,
                    summary: {
                        urgentCount: urgent.length,
                        upcomingCount: upcoming.length,
                        missedCount: missed.length,
                    },
                }
            }
        )

        return NextResponse.json(data, {
            headers: {
                'Cache-Control': 'private, max-age=240, stale-while-revalidate=300',
                'X-Cache': fromCache ? 'HIT' : 'MISS',
            },
        })

    } catch (error) {
        console.error('Renewals API Error:', error)
        return NextResponse.json({ error: 'Failed to fetch renewals' }, { status: 500 })
    }
}
