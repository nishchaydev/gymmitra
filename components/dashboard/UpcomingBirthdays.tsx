import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cake } from "lucide-react"
import { MOCKUP_DATA } from "@/lib/showcase-data"

export function UpcomingBirthdays() {
    const birthdays = MOCKUP_DATA.birthdays

    const getDaysUntil = (dateStr: string) => {
        const today = new Date()
        const [day, monthName] = dateStr.split(' ')
        const months: Record<string, number> = {
            'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
            'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        }

        const birthday = new Date(today.getFullYear(), months[monthName], parseInt(day))

        // If birthday has already passed this year, look at next year
        if (birthday < today) {
            birthday.setFullYear(today.getFullYear() + 1)
        }

        const diffTime = Math.abs(birthday.getTime() - today.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        return diffDays === 0 ? "Today!" : `In ${diffDays} days`
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
                <div className="space-y-8">
                    {birthdays.map((birthday: any, idx: number) => (
                        <div key={idx} className="flex items-center">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={birthday.img} alt={birthday.name} />
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
            </CardContent>
        </Card>
    )
}
