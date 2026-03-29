'use client'

import { useMembers } from '@/hooks/useMembers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { Users, Loader2, Download, Phone, Calendar, ArrowRight, UserCircle, ShieldCheck, Zap, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/empty-state'
import MembersLoading from '@/app/(dashboard)/[slug]/members/loading'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MembersListProps {
    slug: string
    query: string
    status?: string
    dobMonth?: string
    birthday?: string
    duration?: string
    page: number
    take: number
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05
        }
    }
}

const rowVariants: Variants = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30
        }
    }
}

export function MembersList({ slug, query, status, dobMonth, birthday, duration, page, take }: MembersListProps) {
    const { data, isLoading, isFetching, error } = useMembers({
        q: query || undefined,
        status: status || undefined,
        dobMonth: dobMonth || undefined,
        birthday: birthday || undefined,
        duration: duration || undefined,
        page,
        take,
    })

    if (isLoading) {
        return <MembersLoading />
    }

    if (error) {
        return (
            <div className="p-12 rounded-[2.5rem] border border-rose-500/20 bg-rose-500/5 backdrop-blur-3xl text-center">
                <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 text-rose-500 mb-6 ring-1 ring-rose-500/20">
                    <AlertCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2">Failed to load members</h3>
                <p className="text-slate-500 max-w-xs mx-auto mb-8 font-medium">Something went wrong while fetching the member list. Please try again.</p>
                <Button
                    variant="outline"
                    className="h-11 px-8 rounded-xl border-slate-200 hover:bg-white hover:border-slate-300 font-bold transition-all"
                    onClick={() => window.location.reload()}
                >
                    Retry Connection
                </Button>
            </div>
        )
    }

    const { members = [] } = data || {}
    const totalCount = data?.totalCount || 0
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
        return `/${slug}/members?page=${targetPage}${query ? `&q=${encodeURIComponent(query)}` : ''}${status ? `&status=${encodeURIComponent(status)}` : ''}${dobMonth ? `&dobMonth=${encodeURIComponent(dobMonth)}` : ''}${duration ? `&duration=${encodeURIComponent(duration)}` : ''}${birthday ? `&birthday=${encodeURIComponent(birthday)}` : ''}`
    }

    return (
        <div className="relative space-y-6">
            <div className="group relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white/70 backdrop-blur-[40px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] transition-all">
                {isFetching && !isLoading && (
                    <div className="absolute top-6 right-8 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">Updating...</span>
                    </div>
                )}

                <div className="px-10 pt-10 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h2 className="text-4xl font-black tracking-tight text-slate-900">Members Directory</h2>
                            <p className="text-slate-500 text-sm font-semibold flex items-center gap-2">
                                <span className={cn(
                                    "inline-flex items-center justify-center w-6 h-6 rounded-lg bg-primary-500/10 text-primary-600 ring-1 ring-primary-500/20 shadow-sm shadow-primary-500/5",
                                    isFetching && "animate-pulse"
                                )}>
                                    <Users className="w-3.5 h-3.5" />
                                </span>
                                Empowering <span className="text-primary-600 font-bold">{totalCount}</span> active members to reach their full potential.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-12 px-6 rounded-2xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 hover:border-slate-300 font-black text-slate-700 transition-all shrink-0 ring-1 ring-slate-100/50 active:scale-95"
                            onClick={() => window.open('/api/reports/download?type=members', '_blank')}
                        >
                            <Download className="mr-2.5 h-4 w-4 text-primary-500" />
                            EXPORT DIRECTORY
                        </Button>
                    </div>
                </div>

                <div className="px-6 pb-6 mt-2">
                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto rounded-[2.25rem] border border-slate-200/40 bg-white/40 backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
                        <Table>
                            <TableHeader className="bg-slate-50/50 border-b border-slate-200/30">
                                <TableRow className="hover:bg-transparent border-slate-200/60">
                                    <TableHead className="py-6 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Member Profile</TableHead>
                                    <TableHead className="py-6 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Contact Info</TableHead>
                                    <TableHead className="py-6 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Status</TableHead>
                                    <TableHead className="py-6 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Membership</TableHead>
                                    <TableHead className="py-6 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Plan Vitality</TableHead>
                                    <TableHead className="py-6 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="wait">
                                    {members.length === 0 ? (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        >
                                            <TableCell colSpan={6} className="h-[450px] p-0 border-0">
                                                {(() => {
                                                    let emptyTitle = "No members yet"
                                                    let emptyDescription = "Your member directory is empty. Let's start growing your community."
                                                    let showAction = true

                                                    if (query) {
                                                        emptyTitle = "No results found"
                                                        emptyDescription = `No members found matching "${query}".`
                                                        showAction = false
                                                    } else if (status === 'ACTIVE') {
                                                        emptyTitle = "No active memberships"
                                                        emptyDescription = "There are no currently active memberships to display."
                                                        showAction = false
                                                    } else if (status === 'EXPIRED') {
                                                        emptyTitle = "Clear backlog"
                                                        emptyDescription = "Zero expired memberships. Excellent management!"
                                                        showAction = false
                                                    }

                                                    return (
                                                        <div className="w-full h-full flex flex-col items-center justify-center space-y-6">
                                                            <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center ring-1 ring-slate-100 shadow-inner">
                                                                <Users className="w-10 h-10 text-slate-300" />
                                                            </div>
                                                            <div className="text-center space-y-2">
                                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{emptyTitle}</h3>
                                                                <p className="text-slate-500 font-medium max-w-xs mx-auto">{emptyDescription}</p>
                                                            </div>
                                                            {showAction && (
                                                                <Button asChild className="h-12 px-8 rounded-2xl bg-primary-600 hover:bg-primary-700 shadow-xl shadow-primary-600/20 font-black">
                                                                    <Link href={`/${slug}/members/new`}>Register First Member</Link>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )
                                                })()}
                                            </TableCell>
                                        </motion.tr>
                                    ) : (
                                        members.map((member: any) => (
                                            <motion.tr
                                                key={member.id}
                                                variants={rowVariants}
                                                initial="hidden"
                                                animate="visible"
                                                exit="hidden"
                                                className="group/row hover:bg-slate-50/50 transition-colors border-slate-200/60"
                                            >
                                                <TableCell className="py-6 px-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-black flex items-center justify-center text-white shadow-xl shadow-slate-900/10 group-hover/row:scale-110 transition-transform duration-500 overflow-hidden ring-4 ring-white">
                                                            <UserCircle className="w-8 h-8 text-slate-400 group-hover/row:text-slate-200 transition-colors" />
                                                            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity duration-500" />
                                                        </div>
                                                        <Link href={`/${slug}/members/${member.id}`} className="block space-y-1">
                                                            <p className="font-black text-slate-900 group-hover/row:text-primary-600 transition-colors leading-tight text-lg">{member.name}</p>
                                                            <div className="flex items-center gap-1.5 opacity-60">
                                                                <ShieldCheck className="w-3 h-3 text-primary-500" />
                                                                <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">ID: {member.id.substring(0, 8)}</p>
                                                            </div>
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 px-8">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 group/phone cursor-pointer">
                                                            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-400 group-hover/phone:bg-primary-500 group-hover/phone:text-white transition-all duration-300">
                                                                <Phone className="w-3.5 h-3.5" />
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-700 group-hover/phone:text-primary-600 transition-colors">{member.phone}</span>
                                                        </div>
                                                        <p className="text-[10px] font-black text-slate-300 ml-8 uppercase tracking-tighter">Verified Connect</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 px-8">
                                                    <Badge
                                                        variant="outline"
                                                        className={cn(
                                                            "px-4 py-1.5 rounded-2xl border-[1.5px] font-black text-[10px] uppercase tracking-widest transition-all duration-300 shadow-sm",
                                                            member.status === 'ACTIVE' && "bg-emerald-50 text-emerald-700 border-emerald-200/50 shadow-emerald-200/10",
                                                            member.status === 'EXPIRED' && "bg-rose-50 text-rose-700 border-rose-200/50 shadow-rose-200/10 animate-pulse",
                                                            member.status === 'INACTIVE' && "bg-slate-50 text-slate-600 border-slate-200 shadow-none"
                                                        )}
                                                    >
                                                        {member.status === 'ACTIVE' && <Zap className="w-3 h-3 mr-1.5 fill-current" />}
                                                        {member.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell suppressHydrationWarning className="py-6 px-8">
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-2 text-slate-500 font-bold">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            <span className="text-sm text-slate-700">
                                                                {(() => {
                                                                    const date = new Date(member.joiningDate || member.createdAt);
                                                                    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                                                                })()}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-5.5">Since Registration</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 px-8">
                                                    <div className="flex flex-col items-center">
                                                        {(() => {
                                                            const endDate = member.subscriptionEndDate ? new Date(member.subscriptionEndDate) : null;
                                                            if (!endDate || isNaN(endDate.getTime())) {
                                                                return <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 italic">No Active Plan</span>;
                                                            }

                                                            const today = new Date();
                                                            const diffTime = endDate.getTime() - today.getTime();
                                                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                                            if (diffDays < 0) {
                                                                return (
                                                                    <div className="flex flex-col items-center gap-1">
                                                                        <div className="px-4 py-1.5 rounded-2xl bg-rose-500/10 text-rose-600 text-[10px] font-black uppercase border border-rose-500/20 shadow-sm">Overdue Account</div>
                                                                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-tighter">Action Required</span>
                                                                    </div>
                                                                );
                                                            }

                                                            const isCritical = diffDays <= 7;
                                                            const isWarning = diffDays <= 15;
                                                            const progress = Math.min(100, Math.max(8, (diffDays / 30) * 100));

                                                            return (
                                                                <div className="w-36 space-y-2.5">
                                                                    <div className="flex justify-between items-end px-1">
                                                                        <span className={cn(
                                                                            "text-sm font-black tracking-tight",
                                                                            isCritical ? "text-rose-600 animate-pulse" : isWarning ? "text-amber-600" : "text-emerald-600"
                                                                        )}>
                                                                            {diffDays} DAYS
                                                                        </span>
                                                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase">remaining</span>
                                                                    </div>
                                                                    <div className="h-3 w-full bg-slate-100/50 rounded-full overflow-hidden p-1 border border-slate-200/30 shadow-inner">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${progress}%` }}
                                                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                                                            className={cn(
                                                                                "h-full rounded-full transition-all duration-500",
                                                                                progress > 70 ? "bg-emerald-500 shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)]" :
                                                                                    progress > 30 ? "bg-amber-500 shadow-[0_0_12px_-2px_rgba(245,158,11,0.4)]" :
                                                                                        "bg-rose-500 shadow-[0_0_12px_-2px_rgba(244,63,94,0.4)]"
                                                                            )}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )
                                                        })()}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-6 px-8 text-right">
                                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover/row:opacity-100 translate-x-4 group-hover/row:translate-x-0 transition-all duration-500 ease-out">
                                                        {['ACTIVE', 'EXPIRED'].includes(member.status) && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-10 px-5 rounded-2xl border-primary-200 text-primary-600 bg-white hover:bg-primary-600 hover:text-white hover:border-primary-600 font-black text-[10px] uppercase tracking-widest shadow-sm ring-1 ring-primary-100/50 active:scale-[0.97] transition-all duration-200 ease-out"
                                                                asChild
                                                            >
                                                                <Link href={`/${slug}/invoices/new?memberId=${member.id}`}>RENEW PLAN</Link>
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="sm" asChild className="h-11 w-11 p-0 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:bg-slate-50 active:scale-[0.97] transition-all duration-200 ease-out group/btn">
                                                            <Link href={`/${slug}/members/${member.id}`} title="View Member Details">
                                                                <ArrowRight className="w-5 h-5 text-slate-400 group-hover/btn:text-primary-600 transition-colors duration-200" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="px-6 pb-10 md:hidden">
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-5"
                    >
                        {members.length === 0 ? (
                            <div className="py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200/60 flex flex-col items-center justify-center space-y-6">
                                <Users className="w-12 h-12 text-slate-300" />
                                <div className="text-center space-y-1">
                                    <p className="font-black text-slate-900 text-lg">No matches found</p>
                                    <p className="text-slate-500 text-sm font-medium px-4">Refine your search parameters and try again.</p>
                                </div>
                            </div>
                        ) : (
                            members.map((member: any) => (
                                <motion.div
                                    key={member.id}
                                    variants={rowVariants}
                                    className="relative group p-6 rounded-[2.75rem] border border-slate-200/60 bg-white/80 backdrop-blur-2xl shadow-xl shadow-slate-200/10 active:scale-[0.97] transition-all overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-black flex items-center justify-center text-white shadow-2xl shadow-slate-900/20 ring-4 ring-white">
                                                <UserCircle className="w-10 h-10 text-slate-400" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-black text-slate-900 text-xl leading-tight group-active:text-primary-600 transition-colors">{member.name}</p>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <ShieldCheck className="w-3 h-3 text-primary-500/60" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{member.id.substring(0, 8)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "px-3 py-1.5 rounded-xl border-[1.5px] font-black text-[9px] uppercase tracking-[0.15em]",
                                                    member.status === 'ACTIVE' && "bg-emerald-50 text-emerald-700 border-emerald-100 shadow-emerald-200/20",
                                                    member.status === 'EXPIRED' && "bg-rose-50 text-rose-700 border-rose-100 shadow-rose-200/20",
                                                    member.status === 'INACTIVE' && "bg-slate-50 text-slate-600 border-slate-200"
                                                )}
                                            >
                                                {member.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-8 p-6 rounded-[2rem] bg-slate-50/50 border border-slate-100/60 shadow-inner relative group-hover:bg-slate-100/50 transition-colors">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Join Date</p>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5 text-primary-500" />
                                                <p className="text-sm font-black text-slate-900">
                                                    {(() => {
                                                        const date = new Date(member.joiningDate || member.createdAt);
                                                        return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Remaining</p>
                                            <div className="flex items-center gap-2">
                                                <Zap className={cn("w-3.5 h-3.5", member.status === 'ACTIVE' ? "text-emerald-500" : "text-rose-500")} />
                                                <p className={cn("text-sm font-black", member.status === 'ACTIVE' ? 'text-emerald-600' : 'text-rose-600')}>
                                                    {(() => {
                                                        const endDate = member.subscriptionEndDate ? new Date(member.subscriptionEndDate) : null;
                                                        if (!endDate || isNaN(endDate.getTime())) return "N/A";
                                                        const diffDays = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                                        return diffDays < 0 ? "Expired" : `${diffDays} Days`;
                                                    })()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="col-span-2 pt-2">
                                            <div className="h-2 w-full bg-slate-200/50 rounded-full overflow-hidden p-0.5 shadow-inner">
                                                {(() => {
                                                    const endDate = member.subscriptionEndDate ? new Date(member.subscriptionEndDate) : null;
                                                    const today = new Date();
                                                    const diffDays = endDate && !isNaN(endDate.getTime()) ? Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                                                    const progress = Math.min(100, Math.max(8, (diffDays / 30) * 100));
                                                    return (
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-1000",
                                                                progress > 70 ? "bg-emerald-500 shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)]" :
                                                                    progress > 30 ? "bg-amber-500 shadow-[0_0_12px_-2px_rgba(245,158,11,0.4)]" :
                                                                        "bg-rose-500 shadow-[0_0_12px_-2px_rgba(244,63,94,0.4)]"
                                                            )}
                                                            style={{ width: `${diffDays < 0 ? 0 : progress}%` }}
                                                        />
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mt-6">
                                        <Button
                                            variant="outline"
                                            asChild
                                            className="grow h-14 rounded-[1.75rem] border-slate-200 font-black text-slate-700 shadow-sm text-xs uppercase tracking-[0.1em] hover:bg-slate-50 ring-1 ring-slate-100/50 active:scale-[0.97] transition-all duration-200 ease-out"
                                        >
                                            <Link href={`/${slug}/members/${member.id}`}>Details</Link>
                                        </Button>
                                        {['ACTIVE', 'EXPIRED'].includes(member.status) && (
                                            <Button
                                                asChild
                                                className="grow h-14 rounded-[1.75rem] bg-primary-600 hover:bg-primary-700 font-black text-white shadow-xl shadow-primary-600/30 text-xs uppercase tracking-[0.1em] active:scale-[0.97] transition-all duration-200 ease-out"
                                            >
                                                <Link href={`/${slug}/invoices/new?memberId=${member.id}`}>Renew</Link>
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </motion.div>
                </div>

                {/* Pagination */}
                {(totalCount > take || page > 1) && (
                    <div className="px-10 pb-12 flex flex-col sm:flex-row items-center justify-between gap-8 border-t border-slate-100/80 pt-12 mt-4">
                        <p className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400">
                            Showing <span className="text-slate-900 border-b-2 border-primary-500 pb-0.5">{Math.min(totalCount, (page - 1) * take + 1)}</span>
                            <span className="mx-3 text-slate-300">to</span>
                            <span className="text-slate-900 border-b-2 border-slate-900 pb-0.5">{Math.min(page * take, totalCount)}</span>
                            <span className="mx-3 text-slate-300">of</span>
                            <span className="text-primary-600 font-black px-2 py-0.5 rounded-md bg-primary-50 border border-primary-100">{totalCount} Members</span>
                        </p>
                        <Pagination className="justify-center sm:justify-end bg-slate-100/60 rounded-3xl p-1.5 border border-slate-200/50 backdrop-blur-xl shadow-inner-white ring-1 ring-white/50">
                            <PaginationContent className="gap-2">
                                <PaginationItem>
                                    <PaginationPrevious
                                        href={page === 1 ? "#" : createPageUrl(page - 1)}
                                        className={cn(
                                            "rounded-2xl border-transparent h-11 px-6 transition-all font-black text-[10px] uppercase tracking-widest",
                                            page === 1 ? "opacity-30 pointer-events-none" : "hover:bg-white text-slate-600 hover:text-primary-600 shadow-sm"
                                        )}
                                    />
                                </PaginationItem>

                                <div className="hidden sm:flex items-center gap-2 px-1">
                                    {getPageNumbers().map((p, i) => (
                                        <PaginationItem key={i}>
                                            {p === '...' ? (
                                                <PaginationEllipsis className="text-slate-300 w-10 flex justify-center" />
                                            ) : (
                                                <PaginationLink
                                                    isActive={p === page}
                                                    href={createPageUrl(p as number)}
                                                    className={cn(
                                                        "rounded-2xl border-transparent h-11 w-11 p-0 font-black text-xs transition-all duration-300 shadow-sm",
                                                        p === page ?
                                                            "bg-primary-600 text-white shadow-xl shadow-primary-600/30 hover:bg-primary-700 hover:text-white" :
                                                            "hover:bg-white text-slate-500 hover:text-slate-900 hover:shadow-md border border-slate-200/0 hover:border-slate-200"
                                                    )}
                                                >
                                                    {p}
                                                </PaginationLink>
                                            )}
                                        </PaginationItem>
                                    ))}
                                </div>

                                <PaginationItem>
                                    <PaginationNext
                                        href={totalCount <= page * take ? "#" : createPageUrl(page + 1)}
                                        className={cn(
                                            "rounded-2xl border-transparent h-11 px-6 transition-all font-black text-[10px] uppercase tracking-widest",
                                            totalCount <= page * take ? "opacity-30 pointer-events-none" : "hover:bg-white text-slate-600 hover:text-primary-600 shadow-sm"
                                        )}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>
        </div>
    )
}
