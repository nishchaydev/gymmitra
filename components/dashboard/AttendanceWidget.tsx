import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, UserCheck, ArrowRight } from "lucide-react"
import Link from "next/link"

export function AttendanceWidget() {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-green-500" />
                        Today's Attendance
                    </CardTitle>
                    <Link href="/attendance">
                        <Button variant="ghost" size="sm" className="hidden h-8 lg:flex">
                            View All <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
                <CardDescription>
                    Recent check-ins today
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {/* Mock Data - Will be replaced with real data fetch */}
                    <div className="flex items-center">
                        <div className="flex -space-x-3">
                            <Avatar className="border-2 border-background">
                                <AvatarImage src="/avatars/01.png" />
                                <AvatarFallback>JD</AvatarFallback>
                            </Avatar>
                            <Avatar className="border-2 border-background">
                                <AvatarImage src="/avatars/02.png" />
                                <AvatarFallback>SD</AvatarFallback>
                            </Avatar>
                            <Avatar className="border-2 border-background">
                                <AvatarImage src="/avatars/03.png" />
                                <AvatarFallback>MJ</AvatarFallback>
                            </Avatar>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                                +12
                            </div>
                        </div>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">15 Members Checked In</p>
                            <p className="text-sm text-muted-foreground">
                                Last check-in 5 mins ago
                            </p>
                        </div>
                        <div className="ml-auto">
                            <Link href="/attendance/kiosk">
                                <Button size="sm">
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
