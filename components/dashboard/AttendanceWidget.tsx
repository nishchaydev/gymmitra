import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, UserCheck, ArrowRight } from "lucide-react"
import Link from "next/link"
import { MOCKUP_DATA } from "@/lib/showcase-data"

export function AttendanceWidget() {
    const avatars = (MOCKUP_DATA as any).birthdays.map((b: any) => b.img)

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-[#4FC3F7]" />
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
                            {avatars.map((img: string, i: number) => (
                                <Avatar key={i} className="border-2 border-white shadow-sm">
                                    <AvatarImage src={img} />
                                    <AvatarFallback className="bg-slate-100 text-[10px] font-bold">U{i}</AvatarFallback>
                                </Avatar>
                            ))}
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#4FC3F7]/10 text-[#1a365d] text-xs font-bold shadow-sm">
                                +12
                            </div>
                        </div>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-bold text-slate-900 leading-none">15 Members Today</p>
                            <p className="text-sm text-slate-500 font-medium">
                                Last check-in 5 mins ago
                            </p>
                        </div>
                        <div className="ml-auto">
                            <Link href="/attendance/kiosk">
                                <Button size="sm" className="bg-[#1a365d] hover:bg-slate-900 shadow-md">
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
