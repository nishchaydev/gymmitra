import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cake, MessageCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getWhatsAppLink, templates } from "@/lib/whatsapp"
import { MOCKUP_DATA } from "@/lib/showcase-data"
import { cn } from "@/lib/utils"

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
     // Check if the birthday date is valid
     if (isNaN(birthday.getTime())) {
         return null;
     }
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
        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-white group/card hover:shadow-indigo-500/10 transition-all duration-500 h-full">
            <CardHeader className="bg-gradient-to-r from-pink-50/30 to-transparent px-6 py-6 border-b border-drift-100/30">
                <div className="flex items-center justify-between">
                    <div className="space-y-1.5">
                        <CardTitle className="flex items-center gap-2.5 text-lg font-black text-slate-900 uppercase tracking-tight">
                            <div className="h-2 w-2 rounded-full bg-pink-500 animate-pulse" />
                            Birthdays
                        </CardTitle>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Upcoming celebrations</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center border border-pink-100/50 shadow-sm">
                        <Cake className="h-5 w-5 text-pink-500" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 pb-6 px-6">
                {birthdays.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                        <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center">
                            <Cake className="h-5 w-5 text-slate-300" />
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">No birthdays in the next 7 days</p>
                    </div>
                ) : (
                    <div className="space-y-5">
                        {birthdays.map((birthday, idx) => (
                            <div key={idx} className="flex items-center justify-between group/item">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-11 w-11 border-2 border-white shadow-xl ring-1 ring-drift-100/30 transform transition-transform group-hover/item:scale-105">
                                        {birthday.img && <AvatarImage src={birthday.img} alt={birthday.name} />}
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white font-black text-[10px] uppercase">
                                            {(() => { const trimmed = birthday.name?.trim(); return trimmed ? trimmed.split(/\s+/).map((n: string) => n[0]).join('').slice(0, 2) : '?' })()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-black text-slate-900 leading-none group-hover/item:text-indigo-600 transition-colors">{birthday.name}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                            {birthday.date}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hidden sm:block opacity-60">
                                        {getDaysUntil(birthday.date, birthday.diffDays)}
                                    </div>
                                    {birthday.phone && (
                                        <Link
                                            href={getWhatsAppLink(birthday.phone, templates.birthdayWish(birthday.name, gymName))}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <Button size="sm" className="h-9 px-4 text-[10px] rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-black transition-all duration-300 shadow-lg shadow-indigo-500/20 active:scale-95 uppercase tracking-widest">
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
