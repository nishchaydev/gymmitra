import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cake } from "lucide-react"
import { MOCKUP_DATA } from "@/lib/showcase-data"
import { prisma } from "@/lib/prisma"

type Props = {
    isDemo?: boolean
    gymId?: string
}

type BirthdayEntry = {
    name: string
    date: string   // "Today" | "Tomorrow" | "DD Mon"
    img?: string
}

function getDaysUntil(dateStr: string): string | null {
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

    const diffDays = Math.round((birthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today!'
    if (diffDays === 1) return 'Tomorrow'
    return `In ${diffDays} days`
}

export async function UpcomingBirthdays({ isDemo, gymId }: Props) {
    let birthdays: BirthdayEntry[] = []

    if (isDemo) {
        birthdays = (MOCKUP_DATA as any).birthdays
    } else if (gymId) {
        try {
            const today = new Date(); today.setHours(0, 0, 0, 0)
            // Get members with a dateOfBirth to find upcoming birthdays
            const members = await prisma.member.findMany({
                where: { gymId, status: 'ACTIVE' } as any,
                select: { name: true, dateOfBirth: true },
                take: 100,
            })

            const withDays = members
                .filter((m: any) => m.dateOfBirth)
                .map((m: any) => {
                    const dob = new Date(m.dateOfBirth)
                    let next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
                    next.setHours(0, 0, 0, 0)
                    if (next < today) next.setFullYear(today.getFullYear() + 1)
                    const diffDays = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                    const label = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `${dob.getDate()} ${monthNames[dob.getMonth()]}`
                    return { name: m.name, date: label, diffDays }
                })
                .sort((a: any, b: any) => a.diffDays - b.diffDays)
                .slice(0, 5)

            birthdays = withDays
        } catch (e) {
            console.error('[UpcomingBirthdays] DB error:', e instanceof Error ? e.message : String(e))
        }
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
                                    {(birthday as any).img && <img src={(birthday as any).img} alt={birthday.name} />}
                                    <AvatarFallback>{birthday.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{birthday.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Member • {birthday.date}
                                    </p>
                                </div>
                                <div className="ml-auto font-medium text-primary text-xs">
                                    {getDaysUntil(birthday.date)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
