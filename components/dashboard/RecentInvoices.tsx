import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { FileText, ArrowUpRight, Receipt, User, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "../ui/button"

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
        <Card className="col-span-4 border-0 shadow-2xl rounded-3xl overflow-hidden bg-white group/card hover:shadow-indigo-500/10 transition-all duration-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-gradient-to-r from-indigo-50/30 to-transparent border-b border-drift-100/30 px-6 py-6">
                <div className="space-y-1.5">
                    <CardTitle className="flex items-center gap-2.5 text-lg font-black text-slate-900 uppercase tracking-tight">
                        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                        Recent Invoices
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-400 font-bold uppercase tracking-wider">Latest membership and product bills</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                    <Link href={`/${slug}/invoices/new`}>
                        <Button variant="outline" size="sm" className="h-10 px-4 gap-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 font-black transition-all duration-300 rounded-xl shadow-sm uppercase text-[10px] tracking-widest">
                            New Invoice <ArrowUpRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
                        <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center">
                            <Receipt className="h-7 w-7 text-slate-300" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">No invoices yet</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Start billing to see activity here</p>
                        </div>
                        <Link href={`/${slug}/invoices/new`}>
                            <Button size="sm" className="h-9 px-6 text-[10px] font-black rounded-xl bg-indigo-500 text-white uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                                Create Invoice
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-slate-100 shadow-sm">
                                <TableRow className="hover:bg-transparent border-0">
                                    <TableHead className="w-[140px] text-[10px] font-black uppercase tracking-widest text-slate-400 py-5 px-6">Invoice #</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-5">Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 py-5">Member</TableHead>
                                    <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 py-5 pr-8">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.map((invoice: any) => (
                                    <TableRow key={invoice.id} className="hover:bg-indigo-50/30 transition-colors border-b border-slate-50 group/row last:border-0">
                                        <TableCell className="py-6 px-6">
                                            <Link href={`/${slug}/invoices/${invoice.id}`} className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover/row:bg-white transition-colors border border-slate-100 group-hover/row:border-indigo-100 group-hover/row:shadow-sm">
                                                    <FileText className="h-4 w-4 text-slate-400 group-hover/row:text-indigo-500 transition-colors" />
                                                </div>
                                                <span className="text-xs font-black text-slate-900 group-hover/row:text-indigo-600 transition-colors tracking-tight">
                                                    #{invoice.invoiceNumber.split('-').pop()}
                                                </span>
                                            </Link>
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <span className={cn(
                                                "inline-flex items-center rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest border shadow-sm transition-all duration-300",
                                                invoice.paymentStatus === 'PAID'
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100 group-hover/row:bg-emerald-500 group-hover/row:text-white"
                                                    : invoice.paymentStatus === 'PENDING'
                                                        ? "bg-amber-50 text-amber-600 border-amber-100 group-hover/row:bg-amber-500 group-hover/row:text-white"
                                                        : "bg-red-50 text-red-600 border-red-100 group-hover/row:bg-red-500 group-hover/row:text-white"
                                            )}>
                                                {invoice.paymentStatus}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-6">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-100">
                                                    <User className="h-3 w-3 text-slate-400" />
                                                </div>
                                                <span className="text-xs font-black text-slate-700 max-w-[150px] truncate uppercase tracking-tight">
                                                    {invoice.member?.name || 'Walk-in Customer'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-6 pr-8">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-black text-slate-900 tracking-tight group-hover/row:text-indigo-600 transition-colors">
                                                    ₹{Number(invoice.total).toLocaleString('en-IN')}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                    {new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
            <div className="p-4 bg-slate-50/50 border-t border-slate-100/50 flex items-center justify-center">
                <Link href={`/${slug}/invoices`} className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2 group/all">
                    View Billing History <ArrowRight className="h-3 w-3 group-hover/all:translate-x-1 transition-transform" />
                </Link>
            </div>
        </Card>
    )
}
