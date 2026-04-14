import * as React from "react"
import { prisma } from "@/lib/prisma"
import { SHOWCASE_INVOICES } from "@/lib/showcase-data"
import { getIsDemo } from "@/lib/demo"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, Download } from 'lucide-react'

import { InvoiceSearch, InvoiceFilters } from "@/components/invoice/InvoiceFilters"
import { InvoicesList } from "@/components/invoice/InvoicesList"
import { Prisma } from "@prisma/client"

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const revalidate = 60

export const metadata = { title: "Invoices" };

export default async function InvoicesPage({
    searchParams,
    params: routeParams,
}: {
    searchParams: Promise<{ q?: string; status?: string; page?: string }>
    params: Promise<{ slug: string }>
}) {
    const [resolvedParams, resolvedSearchParams] = await Promise.all([routeParams, searchParams])
    const { slug } = resolvedParams
    const query = resolvedSearchParams.q || ''
    const status = resolvedSearchParams.status
    const auth = await import('@/lib/auth').then(mod => mod.getAuthGym())
    const cookieStore = await cookies()

    const isDemo = await getIsDemo(slug)

    if (!auth && !isDemo) {
        redirect("/login")
    }

    let gymId = 'demo'
    if (auth && !isDemo) {
        gymId = auth?.gym?.id
    }

    const take = 50

    const parsedPage = parseInt(resolvedSearchParams.page || '1', 10)
    const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage)
    const skip = (page - 1) * take

    const whereClause: Prisma.InvoiceWhereInput = {
        gymId: gymId
    }

    if (query) {
        whereClause.OR = [
            { invoiceNumber: { contains: query, mode: 'insensitive' } },
            { walkInName: { contains: query, mode: 'insensitive' } },
            { member: { name: { contains: query, mode: 'insensitive' } } },
        ]
    }

    if (status && status !== 'ALL') {
        whereClause.paymentStatus = status as any
    }

    let demoInvoices = SHOWCASE_INVOICES;
    if (isDemo) {
        if (query) {
            demoInvoices = demoInvoices.filter(i =>
                `INV-${i.id}`.toLowerCase().includes(query.toLowerCase()) ||
                String(i.member?.name || '').toLowerCase().includes(query.toLowerCase())
            );
        }
        if (status && status !== 'ALL') {
            demoInvoices = demoInvoices.filter(i => i.status === status);
        }
    }

    const [invoices, totalCount] = isDemo ? [
        demoInvoices.slice(skip, skip + take).map(i => ({
            id: i.id,
            invoiceNumber: `INV-${i.id}`,
            member: i.member,
            paymentStatus: i.status,
            issueDate: i.date,
            total: i.amount
        })),
        demoInvoices.length
    ] : await Promise.all([
        prisma.invoice.findMany({
            where: whereClause,
            orderBy: { issueDate: 'desc' },
            take: take,
            skip: skip,
            include: {
                member: {
                    select: { name: true }
                }
            }
        }),
        prisma.invoice.count({ where: whereClause })
    ])

    const hasMore = totalCount > page * take

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
                <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
                <div className="flex items-center space-x-2">
                    <a href={`/api/reports/download?type=invoices`} download>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" /> Download CSV
                        </Button>
                    </a>
                    <Link href={`/${slug}/invoices/new`}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Generate Invoice
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
                <InvoiceSearch />
                <InvoiceFilters />
            </div>

            <React.Suspense fallback={<div className="h-96 w-full flex items-center justify-center animate-pulse bg-gray-50 dark:bg-[#1e293b] rounded-xl border border-gray-100 dark:border-gray-800"><span className="text-gray-500 font-medium">Loading Invoices...</span></div>}>
                <InvoicesList
                    slug={slug}
                    query={query}
                    status={status}
                    page={page}
                    take={take}
                    isDemo={isDemo}
                    initialData={{
                        invoices: JSON.parse(JSON.stringify(invoices)),
                        totalCount,
                        page,
                        hasMore
                    }}
                />
            </React.Suspense>
        </div>
    )
}
