import { getIsDemo } from '@/lib/demo'
import * as React from "react"
import { Skeleton } from "@/src/components/SkeletonProvider"
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Download } from 'lucide-react'
import { redirect } from 'next/navigation'
import { MemberSearch, MemberFilters } from '@/components/members/MemberFilters'
import { MembersList } from '@/components/members/MembersList'
import { Metadata } from 'next'
import { getAuthGym } from '@/lib/auth'

export const metadata: Metadata = { title: "Members" };

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

    const isDemo = await getIsDemo(slug)
    const auth = await getAuthGym()

    if (!auth && !isDemo) {
        redirect("/login")
    }

    if (auth && !isDemo && auth.gym.slug !== slug) {
        redirect(`/${auth.gym.slug}/members`)
    }

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

