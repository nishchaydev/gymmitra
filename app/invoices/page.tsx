import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { SHOWCASE_INVOICES } from "@/lib/showcase-data"
import { format } from "date-fns"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, FileText } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function InvoicesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const cookieStore = await cookies()

    // Secure Demo Logic
    const isDemo = !user && cookieStore.get('mitra_demo_mode')?.value === 'true'

    if (!user && !isDemo) {
        redirect("/login")
    }

    let gymId = 'demo'
    if (user && !isDemo) {
        const gym = await prisma.gymProfile.findUnique({
            where: { userId: user.id }
        })
        if (!gym) return <div className="p-8">Gym profile not found.</div>
        gymId = gym.id
    }

    const invoices = isDemo ? SHOWCASE_INVOICES.map(i => ({
        id: i.id,
        invoiceNumber: i.id.toUpperCase(),
        issueDate: new Date(i.date),
        dueDate: new Date(i.date),
        total: i.amount,
        paymentStatus: i.status as any, // Cast to any because the enums might not perfectly match local Prisma types yet
        type: i.type as any,
        notes: null,
        subtotal: i.amount,
        discount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        gymId: 'demo',
        memberId: i.member.id,
        member: { name: i.member?.name || 'Walk-in' }
    })) : await prisma.invoice.findMany({
        where: {
            member: {
                gymId: gymId // Enforce data isolation via relation
            }
        },
        orderBy: { issueDate: 'desc' },
        include: {
            member: {
                select: { name: true }
            }
        }
    })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
                <div className="flex items-center space-x-2">
                    <Link href="/invoices/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Generate Invoice
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="border-slate-200">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>All Invoices</CardTitle>
                            <CardDescription>
                                Manage and view all generated invoices.
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
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-auto p-0 border-0">
                                            <EmptyState
                                                icon={FileText}
                                                title="No invoices yet"
                                                description="Generate your first invoice for a membership or product sale."
                                                actionLabel="Add First Invoice"
                                                actionHref="/invoices/new"
                                                className="border-0 bg-transparent rounded-none"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invoices.map((invoice: any) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                            <TableCell>{invoice.member?.name || 'Walk-in Customer'}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    invoice.paymentStatus === 'PAID' ? 'default' :
                                                        invoice.paymentStatus === 'PENDING' ? 'secondary' : 'destructive'
                                                }>
                                                    {invoice.paymentStatus}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{format(new Date(invoice.issueDate), 'MMM d, yyyy')}</TableCell>
                                            <TableCell className="text-right font-bold">
                                                ₹{parseFloat(invoice.total.toLocaleString()).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/invoices/${isDemo ? "demo-" + invoice.id : invoice.id}`}>
                                                    <Button variant="ghost" size="sm">View</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
