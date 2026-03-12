import { Prisma } from '@prisma/client'
import { cookies } from 'next/headers'
import * as React from "react"
import { prisma } from '@/lib/prisma'
import { SHOWCASE_MEMBERS } from '@/lib/showcase-data'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberSearch, MemberFilters } from '@/components/members/MemberFilters'
import { MembersList } from '@/components/members/MembersList'

export const dynamic = 'force-dynamic'

export default async function MembersPage({
    searchParams,
    params: routeParams,
}: {
    searchParams: Promise<{ q?: string; status?: string; dobMonth?: string; page?: string }>
    params: Promise<{ slug: string }>
}) {
    const [resolvedParams, resolvedSearchParams] = await Promise.all([routeParams, searchParams])
    const { slug } = resolvedParams
    const query = resolvedSearchParams.q || ''
    const status = resolvedSearchParams.status
    const dobMonth = resolvedSearchParams.dobMonth
    const parsedPage = parseInt(resolvedSearchParams.page || '1', 10)
    const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage)
    const take = 50
    const skip = (page - 1) * take

    const cookieStore = await cookies()
    const envDemoEnabled = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === 'true'
    const isDemo = envDemoEnabled && cookieStore.get('mitra_demo_mode')?.value === 'true'

    const auth = await import('@/lib/auth').then(mod => mod.getAuthGym())

    if (!auth && !isDemo) {
        redirect("/login")
    }

    let gymId = 'demo'
    let hasGymError = false
    let hasNoGym = false

    if (auth && !isDemo) {
        if (!auth.gym) {
            hasNoGym = true
        } else {
            gymId = auth.gym.id
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

    // We don't fetch members on the server for regular users anymore since it is a client-side fetched list, 
    // saving db load natively.


    return (
        <div className="container mx-auto p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Members</h1>
                    <p className="text-muted-foreground">Manage your gym members</p>
                </div>
                <div className="flex gap-2">
                    <a href={`/api/reports/download?type=members`} download>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" /> Download CSV
                        </Button>
                    </a>
                    <Link href={`/${slug}/members/new`}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Member
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border shadow-sm flex-wrap">
                <MemberSearch />
                <MemberFilters />
            </div>
            <React.Suspense fallback={<div className="h-96 w-full flex items-center justify-center animate-pulse bg-gray-50 dark:bg-[#1e293b] rounded-xl"><span className="text-gray-500 font-medium">Loading Members...</span></div>}>
                <MembersList
                    slug={slug}
                    query={query}
                    status={status}
                    dobMonth={dobMonth}
                    page={page}
                    take={take}
                />
            </React.Suspense>
        </div>
    )
}

