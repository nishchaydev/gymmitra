import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, MonitorPlay, Users } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { SHOWCASE_MEMBERS } from "@/lib/showcase-data"
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const cookieStore = await cookies()

    // Secure Demo Logic
    const isDemo = !user && cookieStore.get('mitra_demo_mode')?.value === 'true'

    if (!user && !isDemo) {
        redirect("/login")
    }

    let gymId = 'demo'
    if (user && !isDemo) {
        const gym = await prisma.gymProfile.findUnique({
            where: { userId: user.id }
        })
        if (!gym) return <div className="p-8">Gym profile not found.</div>
        gymId = gym.id
    }

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
            member: { gymId: gymId }, // Enforce data isolation
            date: {
                gte: today,
                lte: endOfDay
            }
        },
        include: {
            member: true
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
                            Today's Check-ins
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
                            {todaysAttendance.map((record) => (
                                <div key={record.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                                            <Clock className="h-5 w-5 text-gray-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-medium leading-none">{record.member.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {isDemo ? (record.member.phone || "").substring(0, 5) + "*****" : record.member.phone}
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
                        <div className="text-center py-8 text-gray-500">
                            No check-ins recorded today.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div >
    )
}
