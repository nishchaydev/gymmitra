import { prisma } from "@/lib/prisma"
import { getIsDemo } from "@/lib/demo"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, MonitorPlay, Users, Download } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { SHOWCASE_MEMBERS } from "@/lib/showcase-data"
import { redirect } from 'next/navigation'
import { getAuthGym } from '@/lib/auth'

export const metadata = { title: "Attendance" };

export default async function AttendancePage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const isDemo = await getIsDemo(slug)
    const auth = await getAuthGym()

    if (!auth && !isDemo) {
        redirect("/login")
    }

    if (auth && !isDemo && auth.gym.slug !== slug) {
        redirect(`/${auth.gym.slug}/attendance`)
    }

    const gymId = isDemo ? 'demo' : auth!.gym.id

    // Stable timestamps for demo mode
    const now = new Date()
    const thirtyMinsAgo = new Date(now.getTime() - 1800000)
    const oneHourAgo = new Date(now.getTime() - 3600000)

    const todaysAttendance = isDemo ? [
        { id: "att1", checkInTime: now, member: { name: SHOWCASE_MEMBERS[0].name, phone: SHOWCASE_MEMBERS[0].phone } },
        { id: "att2", checkInTime: thirtyMinsAgo, member: { name: SHOWCASE_MEMBERS[1].name, phone: SHOWCASE_MEMBERS[1].phone } },
        { id: "att3", checkInTime: oneHourAgo, member: { name: SHOWCASE_MEMBERS[2].name, phone: SHOWCASE_MEMBERS[2].phone } },
    ] : await prisma.attendance.findMany({
        where: {
            gymId,
            date: {
                gte: today,
                lte: endOfDay
            }
        },
        select: {
            id: true,
            checkInTime: true,
            staffId: true,
            member: { select: { name: true, phone: true } },
            staff: { select: { name: true, phone: true } },
        },
        orderBy: {
            checkInTime: 'desc'
        }
    })

    const totalCheckins = todaysAttendance.length

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div className="flex items-center gap-2">
                    <Link href={`/${slug}/dashboard`}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
                </div>
                <div className="flex items-center space-x-2">
                    <a href={`/api/reports/download?type=attendance`} download>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" /> Download CSV
                        </Button>
                    </a>
                    <Link href={`/${slug}/attendance/kiosk`}>
                        <Button>
                            <MonitorPlay className="mr-2 h-4 w-4" /> Launch Kiosk Mode
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Today&apos;s Check-ins
                        </CardTitle>
                        <Users className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCheckins}</div>
                        <p className="text-xs text-muted-foreground">
                            Members checked in today
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {todaysAttendance.length > 0 ? (
                        <div className="space-y-4">
                            {todaysAttendance.map((record: any) => (
                                <div key={record.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                            <Clock className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium leading-none">
                                                    {record.member?.name || record.staff?.name || "Unknown"}
                                                </p>
                                                {record.staffId && (
                                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Staff</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {isDemo ? ((record.member?.phone || record.staff?.phone || "").substring(0, 5) + "*****") : (record.member?.phone || record.staff?.phone)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline">
                                            {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 space-y-3">
                            <Users className="w-12 h-12 text-slate-200 mx-auto" />
                            <div className="space-y-1">
                                <p className="text-slate-900 font-extrabold text-lg">No check-ins today yet.</p>
                                <p className="text-slate-500 font-medium italic">The gym hasn&apos;t seen any check-ins today yet. Motivation is coming!</p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    )
}
