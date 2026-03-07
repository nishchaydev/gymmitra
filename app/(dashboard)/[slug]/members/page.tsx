import { Prisma } from '@prisma/client'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { SHOWCASE_MEMBERS } from '@/lib/showcase-data'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberSearch, MemberFilters } from '@/components/members/MemberFilters'
import { MembersList } from '@/components/members/MembersList'

export const dynamic = 'force-dynamic'

export default async function MembersPage({
    searchParams,
    params: routeParams,
}: {
    searchParams: Promise<{ q?: string; status?: string; page?: string }>
    params: Promise<{ slug: string }>
}) {
    const [resolvedParams, resolvedSearchParams] = await Promise.all([routeParams, searchParams])
    const { slug } = resolvedParams
    const query = resolvedSearchParams.q || ''
    const status = resolvedSearchParams.status
    const parsedPage = parseInt(resolvedSearchParams.page || '1', 10)
    const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage)
    const take = 50
    const skip = (page - 1) * take

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const cookieStore = await cookies()

    const isDemo = !user && cookieStore.get('mitra_demo_mode')?.value === 'true'

    if (!user && !isDemo) {
        redirect("/login")
    }

    let gymId = 'demo'
    let hasGymError = false
    let hasNoGym = false

    if (user && !isDemo) {
        try {
            const gym = await prisma.gymProfile.findUnique({
                where: { userId: user.id }
            })
            if (!gym) {
                hasNoGym = true
            } else {
                gymId = gym.id
            }
        } catch (error) {
            console.error("Failed to load gym profile for members:", error)
            hasGymError = true
        }
    }

    if (hasNoGym) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 text-center p-8">
                <div className="text-destructive font-bold text-xl">Gym Profile Not Found</div>
                <p className="text-muted-foreground">Please complete your onboarding to access members.</p>
                <Link href="/onboarding">
                    <Button>Go to Onboarding</Button>
                </Link>
            </div>
        )
    }

    if (hasGymError) {
        return (
            <div className="p-8 text-center text-destructive">
                System error loading profile. Please try refreshing.
            </div>
        )
    }

    const whereClause: Prisma.MemberWhereInput = {
        gymId: gymId
    }

    if (query) {
        whereClause.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
        ]
    }

    if (status && status !== 'ALL') {
        whereClause.status = status as any
    }

    let allDemoMembers = isDemo ? [...SHOWCASE_MEMBERS as any[]] : []
    if (isDemo) {
        if (query) {
            const lowQuery = query.toLowerCase()
            allDemoMembers = allDemoMembers.filter(m =>
                (m.name?.toLowerCase().includes(lowQuery)) ||
                (m.phone && m.phone.toLowerCase().includes(lowQuery)) ||
                (m.email && m.email.toLowerCase().includes(lowQuery))
            )
        }
        if (status && status !== 'ALL') {
            allDemoMembers = allDemoMembers.filter(m => m.status === status)
        }
    }

    let members = isDemo
        ? [...allDemoMembers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(skip, skip + take)
        : []

    let totalCount = isDemo ? allDemoMembers.length : 0

    if (!isDemo) {
        try {
            const [dbMembers, dbCount] = await Promise.all([
                prisma.member.findMany({
                    where: whereClause,
                    orderBy: { createdAt: 'desc' },
                    take: take,
                    skip: skip
                }),
                prisma.member.count({ where: whereClause })
            ])
            members = dbMembers
            totalCount = dbCount
        } catch (error) {
            console.error("Failed to load members:", error)
            return (
                <div className="p-8 text-center text-destructive">
                    System error loading members. Please try refreshing.
                </div>
            )
        }
    }
    const hasMore = totalCount > page * take

    return (
        <div className="container mx-auto p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Members</h1>
                    <p className="text-muted-foreground">Manage your gym members</p>
                </div>
                <Link href={`/${slug}/members/new`}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Member
                    </Button>
                </Link>
            </div>

            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
                <MemberSearch />
                <MemberFilters />
            </div>

            <MembersList
                slug={slug}
                query={query}
                status={status}
                page={page}
                take={take}
            />
        </div>
    )
}

