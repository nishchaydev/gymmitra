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
                            <div className="ml-auto font-medium text-primary">---</div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
