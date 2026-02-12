import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cake } from "lucide-react"

export function UpcomingBirthdays() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Cake className="h-5 w-5 text-pink-500" />
                    Upcoming Birthdays
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    <div className="flex items-center">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src="/avatars/01.png" alt="Avatar" />
                            <AvatarFallback>OM</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Olivia Martin</p>
                            <p className="text-sm text-muted-foreground">
                                Turning 24 • Tomorrow
                            </p>
                        </div>
                        <div className="ml-auto font-medium text-pink-600">May 13</div>
                    </div>
                    <div className="flex items-center">
                        <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
                            <AvatarImage src="/avatars/02.png" alt="Avatar" />
                            <AvatarFallback>JL</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Jackson Lee</p>
                            <p className="text-sm text-muted-foreground">Turning 30 • In 3 days</p>
                        </div>
                        <div className="ml-auto font-medium text-pink-600">May 15</div>
                    </div>
                    <div className="flex items-center">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src="/avatars/03.png" alt="Avatar" />
                            <AvatarFallback>IN</AvatarFallback>
                        </Avatar>
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Isabella Nguyen</p>
                            <p className="text-sm text-muted-foreground">
                                Turning 28 • In 5 days
                            </p>
                        </div>
                        <div className="ml-auto font-medium text-pink-600">May 17</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
