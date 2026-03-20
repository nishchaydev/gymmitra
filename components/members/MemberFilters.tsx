'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter, Calendar, Clock, Crown } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useOrgSlug } from '@/hooks/use-org-slug'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { motion, AnimatePresence } from 'framer-motion'

export function MemberSearch() {
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
            router.push(`/${slug}/members?${params.toString()}`)
        })
    }

    return (
        <form onSubmit={handleSearch} className="relative flex-1 group max-w-md">
            <motion.div
                initial={false}
                animate={{
                    scale: isPending ? 0.98 : 1,
                    opacity: isPending ? 0.7 : 1
                }}
                className="relative"
            >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-all duration-300" />
                <Input
                    placeholder="Search members..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-11 pr-4 w-full bg-white border-slate-200 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all duration-300 rounded-xl h-11 text-base font-medium shadow-sm group-focus-within:border-primary/40 placeholder:text-slate-400"
                    disabled={isPending}
                />
            </motion.div>
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
        if (!slug) return
        const params = new URLSearchParams(searchParams.toString())
        params.delete('page')
        if (status === 'ALL') params.delete('status')
        else params.set('status', status)
        startTransition(() => router.push(`/${slug}/members?${params.toString()}`))
    }

    const handleFilterMonth = (month: string) => {
        if (!slug) return
        const params = new URLSearchParams(searchParams.toString())
        params.delete('page')
        if (month === 'ALL') params.delete('dobMonth')
        else params.set('dobMonth', month)
        startTransition(() => router.push(`/${slug}/members?${params.toString()}`))
    }

    const handleFilterBirthday = () => {
        if (!slug) return
        const params = new URLSearchParams(searchParams.toString())
        params.delete('page')
        if (searchParams.get('birthday') === 'today') {
            params.delete('birthday')
        } else {
            params.set('birthday', 'today')
            params.delete('dobMonth')
        }
        startTransition(() => router.push(`/${slug}/members?${params.toString()}`))
    }

    const handleFilterDuration = (duration: string) => {
        if (!slug) return
        const params = new URLSearchParams(searchParams.toString())
        params.delete('page')
        if (duration === 'ALL') params.delete('duration')
        else params.set('duration', duration)
        startTransition(() => router.push(`/${slug}/members?${params.toString()}`))
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide shrink-0">
                {/* Birthday Month Selector */}
                <div className="flex items-center gap-2 shrink-0 bg-white p-1 rounded-xl border border-slate-200 shadow-sm transition-all duration-300">
                    <Select value={currentMonth} onValueChange={handleFilterMonth} disabled={isPending}>
                        <SelectTrigger className="w-[160px] h-10 border-none bg-transparent hover:bg-white/40 transition-all rounded-xl focus:ring-0 font-medium">
                            <Calendar className="mr-2 h-4 w-4 text-primary/70" />
                            <SelectValue placeholder="Birth Month" />
                        </SelectTrigger>
                        <SelectContent className="backdrop-blur-2xl bg-white/90 rounded-2xl border-white/40 shadow-2xl p-1">
                            <SelectItem value="ALL" className="rounded-lg">All Months</SelectItem>
                            {[
                                'January', 'February', 'March', 'April', 'May', 'June',
                                'July', 'August', 'September', 'October', 'November', 'December'
                            ].map((m, i) => (
                                <SelectItem key={m} value={String(i + 1)} className="rounded-lg">{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="w-[1px] h-5 bg-white/20" />

                    <Select value={currentDuration} onValueChange={handleFilterDuration} disabled={isPending}>
                        <SelectTrigger className="w-[150px] h-10 border-none bg-transparent hover:bg-white/40 transition-all rounded-xl focus:ring-0 font-medium">
                            <Clock className="mr-2 h-4 w-4 text-primary/70" />
                            <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                        <SelectContent className="backdrop-blur-2xl bg-white/90 rounded-2xl border-white/40 shadow-2xl p-1">
                            <SelectItem value="ALL" className="rounded-lg">All Durations</SelectItem>
                            <SelectItem value="1" className="rounded-lg">1 Month</SelectItem>
                            <SelectItem value="3" className="rounded-lg">3 Months</SelectItem>
                            <SelectItem value="6" className="rounded-lg">6 Months</SelectItem>
                            <SelectItem value="12" className="rounded-lg">12 Months</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Status Chips */}
                <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm shrink-0 relative overflow-hidden">
                    {[
                        { label: 'All', value: 'ALL' },
                        { label: 'Active', value: 'ACTIVE' },
                        { label: 'Inactive', value: 'INACTIVE' },
                        { label: 'Expired', value: 'EXPIRED' }
                    ].map((status) => {
                        const isActive = currentStatus === status.value;
                        return (
                            <button
                                key={status.value}
                                onClick={() => handleFilter(status.value)}
                                disabled={isPending}
                                className={cn(
                                    "relative px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap overflow-hidden group",
                                    isActive
                                        ? "text-white"
                                        : "text-slate-500 hover:text-slate-800"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeFilter"
                                        className="absolute inset-0 bg-primary shadow-lg shadow-primary/25 rounded-xl"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <span className="relative z-10">
                                    {status.label}
                                </span>

                                {/* Subtle hover effect for non-active buttons */}
                                {!isActive && (
                                    <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 25px -5px rgba(244, 114, 182, 0.4)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleFilterBirthday}
                    disabled={isPending}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shrink-0 border shadow-sm",
                        searchParams.get('birthday') === 'today'
                            ? "bg-slate-900 text-white border-none shadow-slate-200"
                            : "bg-white border-slate-200 text-muted-foreground hover:bg-slate-50 hover:text-rose-600"
                    )}
                >
                    <motion.span 
                        animate={searchParams.get('birthday') === 'today' ? {
                            rotate: [0, 10, -10, 10, 0],
                            scale: [1, 1.2, 1, 1.2, 1]
                        } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-lg"
                    >
                        🎂
                    </motion.span>
                    Today's Birthday
                </motion.button>
            </div>
        </div>
    )
}
