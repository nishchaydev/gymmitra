'use client'

import { useInvoices } from '@/hooks/useInvoices'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from "date-fns"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
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
        slug,
        initialData,
    })

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

    const invoices = (data?.invoices || initialData?.invoices) ?? []
    const totalCount = (data?.totalCount || initialData?.totalCount) ?? 0
    const hasMore = (data?.hasMore ?? initialData?.hasMore) ?? false
    const totalPages = Math.max(1, Math.ceil(totalCount / take))

    const getPageNumbers = () => {
        const pages = []
        const delta = 1
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
                pages.push(i)
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...')
            }
        }
        return pages
    }

    const createPageUrl = (targetPage: number) => {
        return `/${slug}/invoices?page=${targetPage}${query ? `&q=${encodeURIComponent(query)}` : ''}${status ? `&status=${encodeURIComponent(status)}` : ''}`
    }

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

                </div>
            </CardHeader>
            <CardContent>
                <div className="mt-4">
                    {/* Desktop Table View */}
                    <div className="hidden sm:block overflow-x-auto">
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
                                            <TableCell className="max-w-[150px]"><span className="block truncate" title={invoice.member?.name || invoice.walkInName || 'Walk-in Customer'}>{invoice.member?.name || invoice.walkInName || 'Walk-in Customer'}</span></TableCell>
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

                    {/* Mobile Card View */}
                    <div className="grid grid-cols-1 gap-4 sm:hidden">
                        {invoices.length === 0 ? (
                            <EmptyState
                                icon={FileText}
                                title="No invoices yet"
                                description="Generate your first invoice for a membership or product sale."
                                actionLabel="Add First Invoice"
                                actionHref={`/${slug}/invoices/new`}
                            />
                        ) : (
                            invoices.map((invoice: any) => (
                                <Card key={invoice.id} className="overflow-hidden border-2 border-slate-100 shadow-sm rounded-2xl active:scale-[0.98] transition-transform">
                                    <div className="p-4 bg-white">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-black text-slate-900 text-base leading-tight mb-0.5">{invoice.invoiceNumber}</h3>
                                                <p className="text-xs font-bold text-drift-500">{invoice.member?.name || invoice.walkInName || 'Walk-in Customer'}</p>
                                            </div>
                                            <Badge className="text-[10px] font-black uppercase px-2 h-5 rounded-md" variant={
                                                invoice.paymentStatus === 'PAID' ? 'default' :
                                                    invoice.paymentStatus === 'PENDING' ? 'secondary' :
                                                        invoice.paymentStatus === 'PARTIAL' ? 'secondary' : 'destructive'
                                            }>
                                                {invoice.paymentStatus}
                                            </Badge>
                                        </div>

                                        <div className="flex justify-between items-center py-2 border-t border-slate-50">
                                            <span className="text-[10px] font-black text-drift-400 uppercase tracking-widest">{invoice.issueDate ? format(new Date(invoice.issueDate), 'MMM d, yyyy') : '-'}</span>
                                            <span className="text-sm font-black text-slate-900">₹{parseFloat(Number(invoice.total || 0).toString()).toLocaleString()}</span>
                                        </div>

                                        <div className="pt-3 border-t border-slate-50">
                                            <Link href={`/${slug}/invoices/${isDemo ? "demo-" + invoice.id : invoice.id}`}>
                                                <Button className="w-full h-10 bg-drift-50 hover:bg-drift-100 text-slate-900 font-black uppercase tracking-wider text-[10px] rounded-xl" variant="ghost">
                                                    VIEW DETAILS
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                {(totalCount > take || page > 1) && (
                    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4">
                        <p className="text-sm text-muted-foreground whitespace-nowrap">
                            Showing <span className="font-bold">{(page - 1) * take + 1}</span> to <span className="font-bold">{Math.min(page * take, totalCount)}</span> of <span className="font-bold">{totalCount}</span> invoices
                        </p>
                        <Pagination className="justify-end cursor-pointer">
                            <PaginationContent>
                                <PaginationItem>
                                    {page === 1 ? (
                                        <PaginationPrevious href="#" className="pointer-events-none opacity-50" />
                                    ) : (
                                        <PaginationPrevious href={createPageUrl(page - 1)} />
                                    )}
                                </PaginationItem>
                                
                                {getPageNumbers().map((p, i) => (
                                    <PaginationItem key={i}>
                                        {p === '...' ? (
                                            <PaginationEllipsis />
                                        ) : (
                                            <PaginationLink isActive={p === page} href={createPageUrl(p as number)}>
                                                {p}
                                            </PaginationLink>
                                        )}
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    {!hasMore ? (
                                        <PaginationNext href="#" className="pointer-events-none opacity-50" />
                                    ) : (
                                        <PaginationNext href={createPageUrl(page + 1)} />
                                    )}
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
