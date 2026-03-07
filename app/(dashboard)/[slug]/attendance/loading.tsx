import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function AttendanceLoading() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6" aria-busy="true" aria-live="polite">
            <div className="flex items-center justify-between space-y-2">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <Skeleton className="h-9 w-[150px]" />
                </div>
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-[160px] rounded-md" />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-5 w-[120px]" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-8 w-[60px] mb-2" />
                        <Skeleton className="h-4 w-[150px]" />
                    </CardContent>
                </Card>
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <Skeleton className="h-6 w-[150px]" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-5 w-[140px]" />
                                        <Skeleton className="h-4 w-[100px]" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-6 w-[70px] rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <span className="sr-only">Loading attendance records...</span>
        </div>
    )
}
