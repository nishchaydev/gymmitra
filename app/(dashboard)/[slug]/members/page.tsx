import { Prisma } from '@prisma/client'
import { cookies } from 'next/headers'
import { getIsDemo } from '@/lib/demo'
import * as React from "react"
import { Skeleton } from "@/src/components/SkeletonProvider"
import { prisma } from '@/lib/prisma'
import { SHOWCASE_MEMBERS } from '@/lib/showcase-data'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Download } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberSearch, MemberFilters } from '@/components/members/MemberFilters'
import { MembersList } from '@/components/members/MembersList'
import { Metadata } from 'next'

export const metadata: Metadata = { title: "Members" };

export const dynamic = 'force-dynamic'

export default async function MembersPage({
    searchParams,
    params: routeParams,
}: {
    searchParams: Promise<{ q?: string; status?: string; dobMonth?: string; birthday?: string; duration?: string; page?: string }>
    params: Promise<{ slug: string }>
}) {
    const [resolvedParams, resolvedSearchParams] = await Promise.all([routeParams, searchParams])
    const { slug } = resolvedParams
    const query = resolvedSearchParams.q || ''
    const status = resolvedSearchParams.status
    const dobMonth = resolvedSearchParams.dobMonth
    const birthday = resolvedSearchParams.birthday
    const duration = resolvedSearchParams.duration
    const parsedPage = parseInt(resolvedSearchParams.page || '1', 10)
    const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage)
    const take = 10
    const skip = (page - 1) * take

    const isDemo = await getIsDemo(slug)

    const auth = await import('@/lib/auth').then(mod => mod.getAuthGym())

    if (!auth && !isDemo) {
        redirect("/login")
    }

    let gymId = 'demo'
    const hasGymError = false
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
        <Skeleton name="members" loading={false}>
            <div className="container mx-auto p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Members</h1>
                    <p className="text-drift-400 font-medium">Manage your gym members and their subscriptions</p>
                </div>
                <div className="flex gap-3">
                    <a href={`/api/reports/download?type=members`} download>
                        <Button variant="outline" className="h-11 px-6 rounded-xl border-slate-200 hover:bg-white hover:border-slate-300 font-bold transition-all shadow-sm">
                            <Download className="mr-2 h-4 w-4 text-slate-500" /> Download CSV
                        </Button>
                    </a>
                    <Link href={`/${slug}/members/new`}>
                        <Button className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xl shadow-slate-200">
                            <Plus className="mr-2 h-5 w-5" /> Add Member
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4 lg:items-center bg-slate-50/50 p-2 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex-1 min-w-[300px]">
                    <MemberSearch />
                </div>
                <div className="flex-shrink-0">
                    <MemberFilters />
                </div>
            </div>
            <React.Suspense fallback={<div className="h-96 w-full flex items-center justify-center animate-pulse bg-gray-50 dark:bg-[#1e293b] rounded-xl"><span className="text-gray-500 font-medium">Loading Members...</span></div>}>
                <MembersList
                    slug={slug}
                    query={query}
                    status={status}
                    dobMonth={dobMonth}
                    birthday={birthday}
                    duration={duration}
                    page={page}
                    take={take}
                />
            </React.Suspense>
        </div>
        </Skeleton>
    )
}

