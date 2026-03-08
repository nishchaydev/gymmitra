'use client'

import { useMembers } from '@/hooks/useMembers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import MembersLoading from '@/app/(dashboard)/[slug]/members/loading'

interface MembersListProps {
    slug: string
    query: string
    status?: string
    page: number
    take: number
}

export function MembersList({ slug, query, status, page, take }: MembersListProps) {
    const { data, isLoading, isFetching, error } = useMembers({
        q: query || undefined,
        status: status || undefined,
        page,
        take,
    })

    if (isLoading) {
        return <MembersLoading />
    }

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50/50">
                <CardContent className="pt-6 text-center text-red-600">
                    <p className="font-medium">Failed to load members.</p>
                </CardContent>
            </Card>
        )
    }

    const { members = [], totalCount = 0, hasMore = false } = data || {}

    return (
        <Card className="border-slate-200 relative">
            {isFetching && !isLoading && (
                <div className="absolute top-2 right-2 z-10">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            )}
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Gym Members</CardTitle>
                        <CardDescription>
                            A list of all members in your gym.
                        </CardDescription>
                    </div>

                </div>
            </CardHeader>
            <CardContent>
                <div className="mt-4">
                    {/* Desktop Table View */}
                    <div className="hidden md:block border rounded-md overflow-x-auto bg-white">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined Date</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-auto p-0 border-0">
                                            {(() => {
                                                let emptyTitle = "No members yet"
                                                let emptyDescription = "Start building your community by adding your first gym member."
                                                let showAction = true

                                                if (query) {
                                                    emptyTitle = "No results found"
                                                    emptyDescription = `No members match "${query}". Try a different search term.`
                                                    showAction = false
                                                } else if (status === 'ACTIVE') {
                                                    emptyTitle = "No active members"
                                                    emptyDescription = "There are currently no members with an active membership."
                                                    showAction = false
                                                } else if (status === 'EXPIRED') {
                                                    emptyTitle = "No expired memberships"
                                                    emptyDescription = "Great news! No members have an expired membership right now."
                                                    showAction = false
                                                } else if (status === 'INACTIVE') {
                                                    emptyTitle = "No inactive members"
                                                    emptyDescription = "There are no members currently marked as inactive."
                                                    showAction = false
                                                }

                                                return (
                                                    <EmptyState
                                                        icon={Users}
                                                        title={emptyTitle}
                                                        description={emptyDescription}
                                                        actionLabel={showAction ? "Add First Member" : undefined}
                                                        actionHref={showAction ? `/${slug}/members/new` : undefined}
                                                        className="border-0 bg-transparent rounded-none"
                                                    />
                                                )
                                            })()}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    members.map((member: any) => (
                                        <TableRow key={member.id} className="hover:bg-slate-50/50">
                                            <TableCell className="font-medium">
                                                <Link href={`/${slug}/members/${member.id}`} className="hover:underline">
                                                    {member.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell className="text-slate-600 font-medium">{member.phone}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={`
                                                        ${member.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                                        ${member.status === 'EXPIRED' ? 'bg-rose-50 text-rose-700 border-rose-200' : ''}
                                                        ${member.status === 'INACTIVE' ? 'bg-slate-50 text-slate-700 border-slate-200' : ''}
                                                    `}
                                                >
                                                    {member.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell suppressHydrationWarning className="text-slate-500">
                                                {(() => {
                                                    const date = new Date(member.joiningDate || member.createdAt);
                                                    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                                                })()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild className="h-8 text-ion-600 hover:text-ion-700 hover:bg-ion-50">
                                                    <Link href={`/${slug}/members/${member.id}`}>View Profile</Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {members.length === 0 ? (
                            <div className="py-12 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                <EmptyState
                                    icon={Users}
                                    title={query ? "No results found" : "No members yet"}
                                    description={query ? `No members match "${query}"` : "Start by adding your first gym member."}
                                    actionLabel={!query ? "Add First Member" : undefined}
                                    actionHref={!query ? `/${slug}/members/new` : undefined}
                                    className="border-0 bg-transparent"
                                />
                            </div>
                        ) : (
                            members.map((member: any) => (
                                <Link
                                    key={member.id}
                                    href={`/${slug}/members/${member.id}`}
                                    className="block p-4 rounded-xl border-2 border-slate-100 bg-white shadow-sm hover:border-ion-200 transition-all active:scale-[0.98]"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-bold text-slate-900 text-lg leading-tight">{member.name}</p>
                                            <p className="text-sm text-slate-500 font-medium">{member.phone}</p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`
                                                text-[10px] uppercase font-bold
                                                ${member.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                                ${member.status === 'EXPIRED' ? 'bg-rose-50 text-rose-700 border-rose-200' : ''}
                                                ${member.status === 'INACTIVE' ? 'bg-slate-50 text-slate-700 border-slate-200' : ''}
                                            `}
                                        >
                                            {member.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                                        <div className="text-[11px] text-slate-500">
                                            <p className="font-medium uppercase tracking-wider">Joined</p>
                                            <p className="text-slate-900 font-bold">
                                                {(() => {
                                                    const date = new Date(member.joiningDate || member.createdAt);
                                                    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                                                })()}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-8 text-ion-600 font-bold text-xs pointer-events-none">
                                            View Profile &rarr;
                                        </Button>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {totalCount > take && (
                    <div className="flex items-center justify-between mt-6 px-2">
                        <p className="text-sm text-muted-foreground">
                            Showing <span className="font-bold">{(page - 1) * take + 1}</span> to <span className="font-bold">{Math.min(page * take, totalCount)}</span> of <span className="font-bold">{totalCount}</span> members
                        </p>
                        {page === 1 ? (
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                        ) : (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/${slug}/members?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}${status ? `&status=${encodeURIComponent(status)}` : ''}`}>
                                    Previous
                                </Link>
                            </Button>
                        )}
                        {!hasMore ? (
                            <Button variant="outline" size="sm" disabled>Next</Button>
                        ) : (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/${slug}/members?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ''}${status ? `&status=${encodeURIComponent(status)}` : ''}`}>
                                    Next
                                </Link>
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
