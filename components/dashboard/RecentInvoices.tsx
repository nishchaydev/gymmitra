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
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "../ui/button"
import { EmptyState } from "@/components/ui/empty-state"

import { SHOWCASE_STATS } from "@/lib/showcase-data"

export function RecentInvoices({ isDemo, data, slug }: { isDemo?: boolean, data?: any[], slug: string }) {
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
        <Card className="col-span-4 border-drift-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-l-4 border-l-ion-500 pl-4 py-4">
                <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-drift-900">
                        <FileText className="h-5 w-5 text-ion-500" />
                        Recent Invoices
                    </CardTitle>
                    <CardDescription className="text-sm text-drift-400">Latest generated invoices for memberships and products.</CardDescription>
                </div>
                <Link href={`/${slug}/invoices/new`}>
                    <Button variant="ghost" size="sm" className="h-9 gap-2 text-drift-500 hover:text-ion-500 hover:bg-ion-50 font-medium transition-all">
                        New Invoice <ArrowUpRight className="h-4 w-4" />
                    </Button>
                </Link>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-b border-drift-100 bg-drift-50/30">
                                <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-widest text-drift-400 py-3">Invoice</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-widest text-drift-400 py-3">Status</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-widest text-drift-400 py-3">Member</TableHead>
                                <TableHead className="text-right text-xs font-semibold uppercase tracking-widest text-drift-400 py-3">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-[300px] text-center p-0 border-0">
                                        <EmptyState
                                            icon={FileText}
                                            title="No recent invoices"
                                            description="Start billing members to see history here."
                                            actionLabel="Create Invoice"
                                            actionHref={`/${slug}/invoices/new`}
                                            className="border-0 bg-transparent py-12"
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice: any) => (
                                    <TableRow key={invoice.id} className="hover:bg-drift-50/50 transition-colors border-b border-drift-100 last:border-0">
                                        <TableCell className="font-semibold text-ion-500 py-4">
                                            <Link href={`/${slug}/invoices/${invoice.id}`} className="hover:underline hover:text-ion-600 transition-all underline-offset-4 decoration-2">
                                                {invoice.invoiceNumber}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <span className={cn(
                                                "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                                                invoice.paymentStatus === 'PAID'
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : invoice.paymentStatus === 'PENDING'
                                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                                        : "bg-red-50 text-red-700 border-red-200"
                                            )}>
                                                {invoice.paymentStatus}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-[150px] truncate py-4 font-medium text-drift-700">
                                            {invoice.member?.name || 'Walk-in'}
                                        </TableCell>
                                        <TableCell className="text-right font-bold tracking-tight text-drift-900 py-4">
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

