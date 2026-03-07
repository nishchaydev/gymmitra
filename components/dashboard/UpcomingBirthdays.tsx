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
    const birthday = new Date(today.getFullYear(), months[monthName], dayInt)
    birthday.setHours(0, 0, 0, 0)
    if (birthday < today) birthday.setFullYear(today.getFullYear() + 1)

    const diffDaysVal = Math.round((birthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDaysVal === 0) return 'Today!'
    if (diffDaysVal === 1) return 'Tomorrow'
    return `In ${diffDaysVal} days`
}

export function UpcomingBirthdays({ isDemo, gymName = "your gym", data }: Props) {
    let birthdays: BirthdayEntry[] = data || []

    if (isDemo && (!data || data.length === 0)) {
        birthdays = (MOCKUP_DATA as any).birthdays
    }

    return (
        <Card className="border-drift-200 shadow-sm rounded-xl overflow-hidden bg-white">
            <CardHeader className="border-l-4 border-l-indigo-500 pl-4 bg-indigo-50/30">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                    <Cake className="h-5 w-5 text-indigo-500" />
                    Upcoming Birthdays
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                {birthdays.length === 0 ? (
                    <div className="py-8 text-center bg-drift-50/50 rounded-xl border border-dashed border-drift-200">
                        <p className="text-sm text-drift-400 font-medium">No upcoming birthdays</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {birthdays.map((birthday, idx) => (
                            <div key={idx} className="flex items-center group">
                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-drift-100">
                                    {birthday.img && <AvatarImage src={birthday.img} alt={birthday.name} />}
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-bold text-sm">
                                        {(() => { const trimmed = birthday.name?.trim(); return trimmed ? trimmed.split(/\s+/).map((n: string) => n[0]).join('').slice(0, 2) : '?' })()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="ml-3 space-y-0.5">
                                    <p className="text-sm font-bold text-slate-900 leading-none">{birthday.name}</p>
                                    <p className="text-[10px] text-drift-400 font-bold uppercase tracking-tight">
                                        Member • {birthday.date}
                                    </p>
                                </div>
                                <div className="ml-auto flex flex-col items-end gap-1.5">
                                    <div className="text-indigo-600 font-bold text-[10px] uppercase tracking-wider whitespace-nowrap">
                                        {getDaysUntil(birthday.date, birthday.diffDays)}
                                    </div>
                                    {birthday.phone && (
                                        <Link
                                            href={getWhatsAppLink(birthday.phone, templates.birthdayWish(birthday.name, gymName))}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button size="sm" className="h-7 px-4 text-[10px] rounded-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition-all duration-150 shadow-sm active:scale-95 uppercase tracking-wider">
                                                Wish! 🎂
                                            </Button>
                                        </Link>
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
