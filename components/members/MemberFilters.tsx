'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { useState, useTransition } from 'react'

export function MemberSearch() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [query, setQuery] = useState(searchParams.get('q') || '')
    const [isPending, startTransition] = useTransition()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        const params = new URLSearchParams(searchParams.toString())

        if (query.trim()) {
            params.set('q', query.trim())
        } else {
            params.delete('q')
        }

        startTransition(() => {
            router.push(`/members?${params.toString()}`)
        })
    }

    return (
        <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search by name, phone, or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 w-full max-w-sm"
                disabled={isPending}
            />
        </form>
    )
}

export function MemberFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()
    const currentStatus = searchParams.get('status') || 'ALL'

    const handleFilter = (status: string) => {
        const params = new URLSearchParams(searchParams.toString())

        if (status === 'ALL') {
            params.delete('status')
        } else {
            params.set('status', status)
        }

        startTransition(() => {
            router.push(`/members?${params.toString()}`)
        })
    }

    return (
        <div className="flex gap-2">
            <Button
                variant={currentStatus === 'ALL' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilter('ALL')}
                disabled={isPending}
            >
                All
            </Button>
            <Button
                variant={currentStatus === 'ACTIVE' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilter('ACTIVE')}
                disabled={isPending}
            >
                Active
            </Button>
            <Button
                variant={currentStatus === 'EXPIRED' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFilter('EXPIRED')}
                disabled={isPending}
            >
                Expired
            </Button>
        </div>
    )
}
