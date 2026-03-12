'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useOrgSlug } from '@/hooks/use-org-slug'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function MemberSearch() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const slug = useOrgSlug()
    const [query, setQuery] = useState(searchParams.get('q') || '')
    const [isPending, startTransition] = useTransition()

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        if (!slug) return // guard: no slug → don't navigate

        const params = new URLSearchParams(searchParams.toString())

        if (query.trim()) {
            params.set('q', query.trim())
        } else {
            params.delete('q')
        }

        startTransition(() => {
            router.push(`/${slug}/members?${params.toString()}`)
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
    const slug = useOrgSlug()
    const [isPending, startTransition] = useTransition()
    const currentStatus = searchParams.get('status') || 'ALL'
    const currentMonth = searchParams.get('dobMonth') || 'ALL'

    const handleFilter = (status: string) => {
        if (!slug) return // guard: no slug → don't navigate

        const params = new URLSearchParams(searchParams.toString())

        if (status === 'ALL') {
            params.delete('status')
        } else {
            params.set('status', status)
        }

        startTransition(() => {
            router.push(`/${slug}/members?${params.toString()}`)
        })
    }

    const handleFilterMonth = (month: string) => {
        if (!slug) return

        const params = new URLSearchParams(searchParams.toString())
        params.delete('page')

        if (month === 'ALL') {
            params.delete('dobMonth')
        } else {
            params.set('dobMonth', month)
        }

        startTransition(() => {
            router.push(`/${slug}/members?${params.toString()}`)
        })
    }

    return (
        <div className="flex gap-2 items-center flex-wrap">
            <Select value={currentMonth} onValueChange={handleFilterMonth} disabled={isPending}>
                <SelectTrigger className="w-[140px] h-9 bg-white">
                    <SelectValue placeholder="Birthday Month" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Birthdays</SelectItem>
                    <SelectItem value="1">January</SelectItem>
                    <SelectItem value="2">February</SelectItem>
                    <SelectItem value="3">March</SelectItem>
                    <SelectItem value="4">April</SelectItem>
                    <SelectItem value="5">May</SelectItem>
                    <SelectItem value="6">June</SelectItem>
                    <SelectItem value="7">July</SelectItem>
                    <SelectItem value="8">August</SelectItem>
                    <SelectItem value="9">September</SelectItem>
                    <SelectItem value="10">October</SelectItem>
                    <SelectItem value="11">November</SelectItem>
                    <SelectItem value="12">December</SelectItem>
                </SelectContent>
            </Select>

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
                    variant={currentStatus === 'INACTIVE' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilter('INACTIVE')}
                    disabled={isPending}
                >
                    Inactive
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
        </div>
    )
}
