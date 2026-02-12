import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, Search, Filter } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function MembersPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string; status?: string }>
}) {
    const params = await searchParams
    const query = params.q || ''
    const status = params.status

    const whereClause: any = {}

    if (query) {
        whereClause.OR = [
            { name: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
        ]
    }

    if (status && status !== 'ALL') {
        whereClause.status = status
    }

    const members = await prisma.member.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' }
    })

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
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, phone, or email..."
                        defaultValue={query}
                        className="pl-8 w-full max-w-sm"
                    />
                </div>
                {/* Placeholder filter buttons - in real app, these would be interactive filters */}
                <div className="flex gap-2">
                    <Button variant={!status || status === 'ALL' ? 'default' : 'outline'} size="sm">All</Button>
                    <Button variant={status === 'ACTIVE' ? 'default' : 'outline'} size="sm">Active</Button>
                    <Button variant={status === 'EXPIRED' ? 'default' : 'outline'} size="sm">Expired</Button>
                </div>
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
