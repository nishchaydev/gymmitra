import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cake, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getWhatsAppLink, templates } from "@/lib/whatsapp"
import { MOCKUP_DATA } from "@/lib/showcase-data"

type BirthdayEntry = {
    name: string
    phone?: string
    date: string   // "Today" | "Tomorrow" | "DD Mon"
    img?: string
    diffDays?: number
}

type Props = {
    isDemo?: boolean
    gymName?: string
    data?: BirthdayEntry[]
}

function getDaysUntil(dateStr: string, diffDaysFallback?: number): string | null {
    if (diffDaysFallback !== undefined && !isNaN(diffDaysFallback)) {
        if (diffDaysFallback < 0) return null
        if (diffDaysFallback === 0) return 'Today!'
        if (diffDaysFallback === 1) return 'Tomorrow'
        return `In ${diffDaysFallback} days`
    }

    if (dateStr === 'Today') return 'Today!'
    if (dateStr === 'Tomorrow') return 'Tomorrow'

    const months: Record<string, number> = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    }
    const parts = dateStr.split(' ')
    if (parts.length < 2) return null
    const [day, monthName] = parts
    if (months[monthName] === undefined) return null
    const dayInt = parseInt(day)
    if (isNaN(dayInt)) return null

    const today = new Date(); today.setHours(0, 0, 0, 0)
    let birthday = new Date(today.getFullYear(), months[monthName], dayInt)
    birthday.setHours(0, 0, 0, 0)
    if (birthday < today) birthday.setFullYear(today.getFullYear() + 1)

    const diffDaysVal = Math.round((birthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDaysVal === 0) return 'Today!'
    if (diffDaysVal === 1) return 'Tomorrow'
    return `In ${diffDaysVal} days`
}

export async function UpcomingBirthdays({ isDemo, gymName = "your gym", data }: Props) {
    let birthdays: BirthdayEntry[] = data || []

    if (isDemo && (!data || data.length === 0)) {
        birthdays = (MOCKUP_DATA as any).birthdays
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Cake className="h-5 w-5 text-primary" />
                    Upcoming Birthdays
                </CardTitle>
            </CardHeader>
            <CardContent>
                {birthdays.length === 0 ? (
                    <p className="text-sm text-slate-400 font-medium py-4 text-center">No upcoming birthdays</p>
                ) : (
                    <div className="space-y-4">
                        {birthdays.map((birthday, idx) => (
                            <div key={idx} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    {birthday.img && <AvatarImage src={birthday.img} alt={birthday.name} />}
                                    <AvatarFallback>{birthday.name.trim().split(/\s+/).map((n: string) => n[0]).join('').slice(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{birthday.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Member • {birthday.date}
                                    </p>
                                </div>
                                <div className="ml-auto flex items-center gap-3">
                                    <div className="font-medium text-primary text-xs text-right hidden sm:block">
                                        {getDaysUntil(birthday.date, birthday.diffDays)}
                                    </div>
                                    {birthday.phone ? (
                                        <Link
                                            href={getWhatsAppLink(birthday.phone, templates.birthdayWish(birthday.name, gymName))}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button size="sm" className="h-7 px-2 text-xs bg-[#25D366] hover:bg-[#128C7E] text-white">
                                                <MessageCircle className="h-3 w-3 mr-1" />
                                                Wish!
                                            </Button>
                                        </Link>
                                    ) : (
                                        <div className="font-medium text-primary text-xs text-right sm:hidden">
                                            {getDaysUntil(birthday.date, birthday.diffDays)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
