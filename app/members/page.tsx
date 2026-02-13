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
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MemberSearch, MemberFilters } from '@/components/members/MemberFilters'

export const dynamic = 'force-dynamic'

export default async function MembersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string }>
}) {
    const params = await searchParams
    const query = params.q || ''
    const status = params.status

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const cookieStore = await cookies()

    const isDemo = !user && cookieStore.get('mitra_demo_mode')?.value === 'true'

    if (!user && !isDemo) {
        redirect("/login")
    }

    let gymId = 'demo'
    if (user && !isDemo) {
        const gym = await prisma.gymProfile.findUnique({
            where: { userId: user.id }
        })
        if (!gym) {
            return <div className="p-8">Gym profile not found. Please contact support.</div>
        }
        gymId = gym.id
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
        orderBy: { createdAt: 'desc' }
    })

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

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No members found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            members.map((member) => (
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
                                    <TableCell>{new Date(member.joiningDate).toLocaleDateString()}</TableCell>
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
        </div>
    )
}
