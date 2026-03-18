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
    const currentDuration = searchParams.get('duration') || 'ALL'

    const handleFilter = (status: string) => {
        if (!slug) return // guard: no slug → don't navigate

        const params = new URLSearchParams(searchParams.toString())
        params.delete('page')

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

    const handleFilterBirthday = () => {
        if (!slug) return

        const params = new URLSearchParams(searchParams.toString())
        params.delete('page')

        if (searchParams.get('birthday') === 'today') {
            params.delete('birthday')
        } else {
            params.set('birthday', 'today')
            // Optionally clear dobMonth if today is selected
            params.delete('dobMonth')
        }

        startTransition(() => {
            router.push(`/${slug}/members?${params.toString()}`)
        })
    }

    const handleFilterDuration = (duration: string) => {
        if (!slug) return

        const params = new URLSearchParams(searchParams.toString())
        params.delete('page')

        if (duration === 'ALL') {
            params.delete('duration')
        } else {
            params.set('duration', duration)
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

            <Select value={currentDuration} onValueChange={handleFilterDuration} disabled={isPending}>
                <SelectTrigger className="w-[140px] h-9 bg-white">
                    <SelectValue placeholder="Plan Duration" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="ALL">All Durations</SelectItem>
                    <SelectItem value="1">1 Month</SelectItem>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">12 Months</SelectItem>
                </SelectContent>
            </Select>

            <div className="flex gap-2">
                <Button
                    variant={searchParams.get('birthday') === 'today' ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleFilterBirthday}
                    disabled={isPending}
                    className={searchParams.get('birthday') === 'today' ? 'bg-pink-600 hover:bg-pink-700 text-white' : ''}
                >
                    🎂 Today's Birthday
                </Button>
                <div className="w-[1px] h-6 bg-gray-200 mx-1" />
                <Button
                    variant={currentStatus === 'ALL' && !searchParams.get('birthday') ? 'default' : 'outline'}
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
