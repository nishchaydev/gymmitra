'use client'

import { useInvoices } from '@/hooks/useInvoices'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from "date-fns"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import MembersLoading from '@/app/(dashboard)/[slug]/members/loading' // Recycle loading

interface InvoicesListProps {
    slug: string
    query: string
    status?: string
    page: number
    take: number
    isDemo?: boolean
    initialData?: {
        invoices: any[]
        totalCount: number
        page: number
        hasMore: boolean
    }
}

export function InvoicesList({ slug, query, status, page, take, isDemo, initialData }: InvoicesListProps) {
    const { data, isLoading, isFetching, error } = useInvoices({
        q: query || undefined,
        status: status || undefined,
        page,
        take,
        initialData,
    } as any)

    const isPendingAndNoData = isLoading && !initialData

    if (isPendingAndNoData) {
        return <MembersLoading />
    }

    if (error) {
        return (
            <Card className="border-red-200 bg-red-50/50">
                <CardContent className="pt-6 text-center text-red-600">
                    <p className="font-medium">Failed to load invoices.</p>
                </CardContent>
            </Card>
        )
    }

    const { invoices = [], totalCount = 0, hasMore = false } = data || initialData || {}

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
                                            actionHref={`/${slug}/invoices/new`}
                                            className="border-0 bg-transparent rounded-none"
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice: any) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                        <TableCell>{invoice.member?.name || invoice.walkInName || 'Walk-in Customer'}</TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                invoice.paymentStatus === 'PAID' ? 'default' :
                                                    invoice.paymentStatus === 'PENDING' ? 'secondary' :
                                                        invoice.paymentStatus === 'PARTIAL' ? 'secondary' : 'destructive'
                                            }>
                                                {invoice.paymentStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{invoice.issueDate ? format(new Date(invoice.issueDate), 'MMM d, yyyy') : '-'}</TableCell>
                                        <TableCell className="text-right font-bold">
                                            ₹{parseFloat(Number(invoice.total || 0).toString()).toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/${slug}/invoices/${isDemo ? "demo-" + invoice.id : invoice.id}`}>
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
                            Showing <span className="font-bold">{(page - 1) * take + 1}</span> to <span className="font-bold">{Math.min(page * take, totalCount)}</span> of <span className="font-bold">{totalCount}</span> invoices
                        </p>
                        <div className="flex gap-2">
                            {page === 1 ? (
                                <Button variant="outline" size="sm" disabled>
                                    Previous
                                </Button>
                            ) : (
                                <Link href={`/${slug}/invoices?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ''}${status ? `&status=${encodeURIComponent(status)}` : ''}`}>
                                    <Button variant="outline" size="sm">
                                        Previous
                                    </Button>
                                </Link>
                            )}
                            {!hasMore ? (
                                <Button variant="outline" size="sm" disabled>
                                    Next
                                </Button>
                            ) : (
                                <Link href={`/${slug}/invoices?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ''}${status ? `&status=${encodeURIComponent(status)}` : ''}`}>
                                    <Button variant="outline" size="sm">
                                        Next
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
