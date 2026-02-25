import { Prisma } from '@prisma/client'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { SHOWCASE_MEMBERS } from '@/lib/showcase-data'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberSearch, MemberFilters } from '@/components/members/MemberFilters'
import { EmptyState } from '@/components/ui/empty-state'

export const dynamic = 'force-dynamic'

export default async function MembersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
    const params = await searchParams
    const query = params.q || ''
    const status = params.status
    const page = Math.max(1, parseInt(params.page || '1'))
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
    if (user && !isDemo) {
        try {
            const gym = await prisma.gymProfile.findUnique({
                where: { userId: user.id }
            })
            if (!gym) {
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
            gymId = gym.id
        } catch (error) {
            console.error("Failed to load gym profile for members:", error)
            return (
                <div className="p-8 text-center text-destructive">
                    System error loading profile. Please try refreshing.
                </div>
            )
        }
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

    let members = isDemo ? (SHOWCASE_MEMBERS as any[]) : await prisma.member.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: take,
        skip: skip
    })

    const totalCount = isDemo ? members.length : await prisma.member.count({ where: whereClause })
    const hasMore = totalCount > page * take

    if (isDemo) {
        if (query) {
            const lowQuery = query.toLowerCase()
            members = members.filter(m =>
                (m.name?.toLowerCase().includes(lowQuery)) ||
                (m.phone && m.phone.toLowerCase().includes(lowQuery)) ||
                (m.email && m.email.toLowerCase().includes(lowQuery))
            )
        }
        if (status && status !== 'ALL') {
            members = members.filter(m => m.status === status)
        }
    }

    return (
        <div className="container mx-auto p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Members</h1>
                    <p className="text-muted-foreground">Manage your gym members</p>
                </div>
                <Link href="/members/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Member
                    </Button>
                </Link>
            </div>

            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
                <MemberSearch />
                <MemberFilters />
            </div>

            <Card className="border-slate-200">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Gym Members</CardTitle>
                            <CardDescription>
                                A list of all members in your gym.
                            </CardDescription>
                        </div>
                        <div className="text-xs text-slate-400 font-medium sm:hidden block italic">
                            Scroll horizontally ↔
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto -mx-6 sm:mx-0 px-6 sm:px-0">
                        <Table>
                            <TableHeader>
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
                                            <EmptyState
                                                icon={Users}
                                                title="No members yet"
                                                description="Start building your community by adding your first gym member."
                                                actionLabel="Add First Member"
                                                actionHref="/members/new"
                                                className="border-0 bg-transparent rounded-none"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    members.map((member: any) => (
                                        <TableRow key={member.id}>
                                            <TableCell className="font-medium">
                                                <Link href={`/members/${member.id}`} className="hover:underline">
                                                    {member.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{member.phone}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    member.status === 'ACTIVE' ? 'default' :
                                                        member.status === 'EXPIRED' ? 'destructive' : 'secondary'
                                                }>
                                                    {member.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {(() => {
                                                    const date = new Date(member.joiningDate || member.createdAt);
                                                    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
                                                })()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/members/${member.id}`}>
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {totalCount > take && (
                        <div className="flex items-center justify-between mt-6 px-2">
                            <p className="text-sm text-muted-foreground">
                                Showing <span className="font-bold">{(page - 1) * take + 1}</span> to <span className="font-bold">{Math.min(page * take, totalCount)}</span> of <span className="font-bold">{totalCount}</span> members
                            </p>
                            <div className="flex gap-2">
                                <Link href={`/members?page=${page - 1}${query ? `&q=${query}` : ''}${status ? `&status=${status}` : ''}`}>
                                    <Button variant="outline" size="sm" disabled={page === 1}>
                                        Previous
                                    </Button>
                                </Link>
                                <Link href={`/members?page=${page + 1}${query ? `&q=${query}` : ''}${status ? `&status=${status}` : ''}`}>
                                    <Button variant="outline" size="sm" disabled={!hasMore}>
                                        Next
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
