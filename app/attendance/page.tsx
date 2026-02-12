import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Clock, MonitorPlay, Users } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const todaysAttendance = await prisma.attendance.findMany({
        where: {
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
                    <Link href="/dashboard">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
                </div>
                <div className="flex items-center space-x-2">
                    <Link href="/attendance/kiosk">
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
                                            <p className="text-xs text-gray-500">{record.member.phone}</p>
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
        </div>
    )
}
