import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, ArrowUpRight } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "../ui/button"

import { SHOWCASE_STATS } from "@/lib/showcase-data"

export async function RecentInvoices({ isDemo }: { isDemo?: boolean }) {
    let invoices = []

    if (isDemo) {
        invoices = SHOWCASE_STATS.recentInvoices.map((inv, idx) => ({
            ...inv,
            id: `demo-${inv.id}`,
            invoiceNumber: `DEMO-INV-${String(idx + 1).padStart(4, '0')}`,
            total: inv.amount,
            paymentStatus: inv.status,
            createdAt: new Date(inv.date)
        }))
    } else {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return null

        const gym = await prisma.gymProfile.findUnique({
            where: { userId: user.id }
        })

        if (!gym) return null

        invoices = await prisma.invoice.findMany({
            where: { gymId: gym.id } as any,
            include: { member: true } as any,
            orderBy: { createdAt: 'desc' } as any,
            take: 5
        }) as any
    }

    return (
        <Card className="col-span-4">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Recent Invoices
                    </CardTitle>
                    <CardDescription>Latest generated invoices for memberships and products.</CardDescription>
                </div>
                <Link href="/invoices/new">
                    <Button variant="ghost" size="sm" className="h-8 gap-1">
                        New Invoice <ArrowUpRight className="h-3 w-3" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Invoice</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Member</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No invoices generated yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((invoice: any) => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-semibold text-primary">
                                        <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                                            {invoice.invoiceNumber}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={invoice.paymentStatus === 'PAID' ? 'default' : 'secondary'}>
                                            {invoice.paymentStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[150px] truncate">
                                        {invoice.member?.name || 'Walk-in'}
                                    </TableCell>
                                    <TableCell className="text-right font-bold tracking-tight">
                                        ₹{Number(invoice.total).toLocaleString('en-IN')}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
