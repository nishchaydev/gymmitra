import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DashboardLoading() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-[250px]" />
                    <Skeleton className="h-4 w-[350px]" />
                </div>
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-[120px] rounded-md" />
                    <Skeleton className="h-10 w-[120px] rounded-md" />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex space-x-2">
                    <Skeleton className="h-10 w-[100px]" />
                    <Skeleton className="h-10 w-[100px]" />
                    <Skeleton className="h-10 w-[100px]" />
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <Skeleton className="h-4 w-[100px]" />
                                <Skeleton className="h-5 w-5 rounded-lg" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <Skeleton className="h-8 w-[120px]" />
                                    <Skeleton className="h-4 w-[180px]" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Card className="col-span-4">
                        <CardHeader>
                            <Skeleton className="h-6 w-[200px]" />
                            <Skeleton className="h-4 w-[300px]" />
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <Skeleton className="h-full w-full rounded-lg" />
                        </CardContent>
                    </Card>
                    <div className="col-span-3 space-y-4">
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-6 w-[150px]" />
                            </CardHeader>
                            <CardContent className="h-[200px]">
                                <Skeleton className="h-full w-full rounded-lg" />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
