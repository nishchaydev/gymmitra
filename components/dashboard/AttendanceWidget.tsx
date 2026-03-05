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
}

export async function AttendanceWidget({ isDemo, data }: Props) {
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
        />
    )
}

function AttendanceCard({
    avatarCount,
    initials,
    extraCount,
    memberCount,
    lastCheckinLabel,
}: {
    avatarCount?: number
    initials?: string[]
    extraCount: number
    memberCount: number
    lastCheckinLabel: string
}) {
    const slots = initials ?? Array.from({ length: avatarCount ?? 0 }, (_, i) => `U${i}`)

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-primary" />
                        Today&apos;s Attendance
                    </CardTitle>
                    <Link href="/attendance">
                        <Button variant="ghost" size="sm" className="hidden h-8 lg:flex text-primary font-bold hover:bg-primary/5 transition-all">
                            View All <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
                <CardDescription className="font-medium text-slate-500">
                    Real-time gym check-in activity
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    <div className="flex items-center">
                        <div className="flex -space-x-3">
                            {slots.map((label, i) => (
                                <Avatar key={i} className="border-2 border-white shadow-sm">
                                    <AvatarFallback className="bg-slate-100 text-[10px] font-bold">{label}</AvatarFallback>
                                </Avatar>
                            ))}
                            {extraCount > 0 && (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-primary/10 text-midnight text-xs font-bold shadow-sm">
                                    +{extraCount}
                                </div>
                            )}
                        </div>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-bold text-slate-900 leading-none">{memberCount} Members Today</p>
                            <p className="text-sm text-slate-500 font-medium">{lastCheckinLabel}</p>
                        </div>
                        <div className="ml-auto">
                            <Link href="#!">
                                <Button size="sm" className="bg-midnight hover:bg-midnight/90 shadow-md text-white cursor-pointer" type="button" onClick={() => alert("Kiosk mode is available when logged into a specific gym workspace.")}>
                                    <Clock className="mr-2 h-4 w-4" /> Kiosk Mode
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
