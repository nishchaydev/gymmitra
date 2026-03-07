import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, UserCheck, ArrowRight } from "lucide-react"
import Link from "next/link"
import { MOCKUP_DATA } from "@/lib/showcase-data"


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
    if (isDemo || !data) {
        // Demo mode or missing data: render mock/pre-calculated props
        const memberCount = data?.count ?? 15
        const lastCheckinLabel = data?.lastCheckinLabel ?? "Last check-in 5 mins ago"
        const recentInitials = data?.recentInitials ?? ['JD', 'AS', 'RK']

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

    // Real user: use pre-fetched data from props
    return (
        <AttendanceCard
            initials={data.recentInitials}
            extraCount={Math.max(0, data.count - data.recentInitials.length)}
            memberCount={data.count}
            lastCheckinLabel={data.lastCheckinLabel}
            slug={slug}
        />
    )
}

function AttendanceCard({
    avatarCount,
    initials,
    extraCount,
    memberCount,
    lastCheckinLabel,
    slug,
}: {
    avatarCount?: number
    initials?: string[]
    extraCount: number
    memberCount: number
    lastCheckinLabel: string
    slug?: string
}) {
    const slots = initials ?? Array.from({ length: avatarCount ?? 0 }, (_, i) => `U${i}`)

    return (
        <Card className="border-drift-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="border-l-4 border-l-ion-500 pl-4 py-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-drift-900">
                        <UserCheck className="h-5 w-5 text-ion-500" />
                        Today&apos;s Attendance
                    </CardTitle>
                    <Link href={slug ? `/${slug}/attendance` : "/attendance"}>
                        <Button variant="ghost" size="sm" className="hidden h-9 lg:flex text-drift-500 hover:text-ion-500 hover:bg-ion-50 font-medium transition-all group">
                            View All <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                        </Button>
                    </Link>
                </div>

                <div className="flex items-center gap-1.5 mt-1 bg-emerald-50 w-fit px-2 py-0.5 rounded-full">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">REAL-TIME LOG</span>
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="flex -space-x-3">
                                {slots.slice(0, 5).map((label, i) => (
                                    <Avatar key={i} className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-drift-100">
                                        <AvatarFallback className="bg-drift-50 text-[10px] font-bold text-drift-400">{label}</AvatarFallback>
                                    </Avatar>
                                ))}
                                {extraCount > 0 && (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-ion-50 text-ion-600 text-xs font-bold shadow-sm ring-1 ring-drift-100 italic">
                                        +{extraCount}
                                    </div>
                                )}
                            </div>
                            <div className="ml-4 space-y-0.5">
                                <p className="text-xl font-bold text-drift-900 leading-none">{memberCount} Members Today</p>
                                <p className="text-xs text-drift-400 font-medium">{lastCheckinLabel}</p>
                            </div>
                        </div>

                        <Link href="#!">
                            <Button
                                size="sm"
                                variant="outline"
                                className="border border-ion-500 text-ion-500 hover:bg-ion-50 bg-white rounded-lg transition-all duration-150 h-10 px-4 font-semibold shadow-sm"
                                type="button"
                                onClick={() => alert("Kiosk mode is available when logged into a specific gym workspace.")}
                            >
                                <Clock className="mr-2 h-4 w-4" /> Kiosk Mode
                            </Button>
                        </Link>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
