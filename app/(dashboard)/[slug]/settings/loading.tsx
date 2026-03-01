import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
    return (
        <div
            className="container mx-auto p-8 space-y-6"
            aria-busy="true"
            aria-live="polite"
        >
            <div className="space-y-2">
                <Skeleton className="h-10 w-[200px]" />
                <Skeleton className="h-4 w-[320px]" />
            </div>

            {/* Settings sections skeleton */}
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-lg border bg-white p-6 space-y-4">
                        <Skeleton className="h-6 w-[180px]" />
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-[120px]" />
                                <Skeleton className="h-10 w-[250px]" />
                            </div>
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-[150px]" />
                                <Skeleton className="h-10 w-[250px]" />
                            </div>
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-[100px]" />
                                <Skeleton className="h-10 w-[250px]" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <span className="sr-only">Loading settings...</span>
        </div>
    )
}
