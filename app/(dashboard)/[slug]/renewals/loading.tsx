import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function RenewalsLoading() {
    return (
        <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-5 w-72" />
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <Skeleton className="h-12 w-48" />
                    <Skeleton className="h-10 w-32 ml-auto" />
                </div>

                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-0 border-b border-slate-100 flex flex-row space-x-6">
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                        <Skeleton className="h-10 w-32" />
                    </CardHeader>
                    <CardContent className="pt-6 px-6">
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
