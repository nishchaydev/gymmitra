'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useOrgSlug } from '@/hooks/use-org-slug'

export function InvoiceSearch() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const slug = useOrgSlug()
    const [query, setQuery] = useState(searchParams.get('q') || '')
    const [isPending, startTransition] = useTransition()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (!slug) return

        const params = new URLSearchParams(searchParams.toString())

        if (query.trim()) {
            params.set('q', query.trim())
        } else {
            params.delete('q')
        }

        startTransition(() => {
            router.push(`/${slug}/invoices?${params.toString()}`)
        })
    }

    return (
        <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search invoice number, member name... (Press enter)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 w-full max-w-sm"
                disabled={isPending}
            />
        </form>
    )
}

export function InvoiceFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const slug = useOrgSlug()
    const [isPending, startTransition] = useTransition()
    const currentStatus = searchParams.get('status') || 'ALL'

    const handleFilter = (status: string) => {
        if (!slug) return

        const params = new URLSearchParams(searchParams.toString())

        if (status === 'ALL') {
            params.delete('status')
        } else {
            params.set('status', status)
        }

        startTransition(() => {
            router.push(`/${slug}/invoices?${params.toString()}`)
        })
    }

    const filters = ['ALL', 'PAID', 'PENDING', 'PARTIAL', 'OVERDUE']

    return (
        <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
                <Button
                    key={f}
                    variant={currentStatus === f ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilter(f)}
                    disabled={isPending}
                    className="capitalize"
                >
                    {f.toLowerCase()}
                </Button>
            ))}
        </div>
    )
}
