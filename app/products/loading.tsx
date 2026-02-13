import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProductsLoading() {
    return (
        <div className="container mx-auto p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                </div>
                <Skeleton className="h-10 w-[140px] rounded-md" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <Card key={i} className="overflow-hidden">
                        <Skeleton className="h-[200px] w-full" />
                        <CardHeader className="space-y-2">
                            <Skeleton className="h-4 w-[120px]" />
                            <Skeleton className="h-6 w-[180px]" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Skeleton className="h-6 w-[80px]" />
                                <Skeleton className="h-6 w-[60px]" />
                            </div>
                            <Skeleton className="h-10 w-full rounded-md" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
