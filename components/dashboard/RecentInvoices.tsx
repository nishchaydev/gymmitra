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
import { EmptyState } from "@/components/ui/empty-state"

import { SHOWCASE_STATS } from "@/lib/showcase-data"

export async function RecentInvoices({ isDemo, data }: { isDemo?: boolean, data?: any[] }) {
    let invoices = data || []

    if (isDemo && (!data || data.length === 0)) {
        invoices = SHOWCASE_STATS.recentInvoices.map((inv, idx) => ({
            ...inv,
            id: `demo-${inv.id}`,
            invoiceNumber: `DEMO-INV-${String(idx + 1).padStart(4, '0')}`,
            total: inv.amount,
            paymentStatus: inv.status,
            createdAt: new Date(inv.date)
        }))
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
                <div className="overflow-x-auto">
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
                                    <TableCell colSpan={4} className="h-auto p-0 border-0">
                                        <EmptyState
                                            icon={FileText}
                                            title="No recent invoices"
                                            description="Start billing members to see history here."
                                            actionLabel="Create Invoice"
                                            actionHref="/invoices/new"
                                            className="border-0 bg-transparent rounded-none py-8 p-4 shrink-0"
                                        />
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
                </div>
            </CardContent>
        </Card>
    )
}
