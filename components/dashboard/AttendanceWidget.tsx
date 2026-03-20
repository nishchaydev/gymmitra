import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, ArrowRight, UserCheck } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type Props = {
    isDemo?: boolean
    data?: {
        count: number
        recentInitials: string[]
        lastCheckinLabel: string
    }
    slug?: string
}

export function AttendanceWidget({ isDemo, data, slug }: Props) {
    const memberCount = data?.count ?? (isDemo ? 15 : 0)
    const lastCheckinLabel = data?.lastCheckinLabel ?? (isDemo ? "Last check-in 5 mins ago" : "No recent activity")
    const recentInitials = data?.recentInitials ?? (isDemo ? ['JD', 'AS', 'RK', 'ML', 'TY'] : [])

    return (
        <AttendanceCard
            initials={recentInitials}
            extraCount={Math.max(0, memberCount - recentInitials.length)}
            memberCount={memberCount}
            lastCheckinLabel={lastCheckinLabel}
            slug={slug}
        />
    )
}

function AttendanceCard({
    initials,
    extraCount,
    memberCount,
    lastCheckinLabel,
    slug,
}: {
    initials: string[]
    extraCount: number
    memberCount: number
    lastCheckinLabel: string
    slug?: string
}) {
    return (
        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white group/card hover:shadow-primary/10 transition-all duration-500">
            <CardHeader className="bg-gradient-to-r from-emerald-50/30 to-transparent px-6 py-5 border-b border-drift-100/30">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2.5 text-base font-black text-slate-900 uppercase tracking-tight">
                        <div className="relative flex items-center justify-center">
                            <div className="absolute h-3 w-3 rounded-full bg-emerald-400/40 animate-ping" />
                            <div className="relative h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        </div>
                        Live Attendance
                    </CardTitle>
                    <Link href={slug ? `/${slug}/attendance` : "/attendance"} className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary-600 transition-colors flex items-center gap-1.5 group/link">
                        Records <ArrowRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="pt-6 pb-6 px-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3.5 group/stack">
                            {initials.slice(0, 4).map((label, i) => (
                                <Avatar key={i} className="h-10 w-10 border-2 border-white shadow-xl ring-1 ring-drift-100/30 transform transition-transform hover:-translate-y-1 hover:z-10 group-hover/stack:odd:rotate-2 group-hover/stack:even:-rotate-2">
                                    <AvatarFallback className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase">{label}</AvatarFallback>
                                </Avatar>
                            ))}
                            {extraCount > 0 && (
                                <div className="z-[5] flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-emerald-50 text-emerald-600 text-[10px] font-black shadow-xl ring-1 ring-drift-100/30 italic">
                                    +{extraCount}
                                </div>
                            )}
                        </div>
                        <div className="space-y-0.5">
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-black text-slate-900 leading-none">{memberCount}</span>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Present</span>
                            </div>
                            <p className="text-[10px] text-drift-400 font-bold uppercase tracking-widest">{lastCheckinLabel}</p>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 sm:flex-none border-primary/20 text-primary hover:bg-primary-50 bg-white rounded-xl transition-all duration-300 h-10 px-4 text-[11px] font-black uppercase tracking-widest shadow-sm active:scale-95"
                            asChild
                        >
                            <Link href={slug ? `/${slug}/attendance/kiosk` : "#"}>
                                <Clock className="mr-2 h-3.5 w-3.5" /> Kiosk Mode
                            </Link>
                        </Button>
                        <Button
                            size="sm"
                            className="bg-primary hover:bg-primary-600 text-white rounded-xl h-10 w-10 p-0 flex items-center justify-center transition-all duration-300 shadow-lg shadow-primary/20 active:scale-95"
                            title="Quick Entry"
                        >
                            <UserCheck className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
