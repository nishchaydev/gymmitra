export default function LeadsLoading() {
    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-drift-100 animate-pulse" />
                <div className="space-y-2">
                    <div className="h-6 w-48 bg-drift-100 animate-pulse rounded" />
                    <div className="h-4 w-64 bg-drift-100 animate-pulse rounded" />
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-9 w-24 bg-drift-100 animate-pulse rounded-lg shrink-0" />
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-drift-200 overflow-hidden">
                <div className="p-4 border-b border-drift-100">
                    <div className="h-10 w-full bg-drift-50 animate-pulse rounded-lg" />
                </div>
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b border-drift-50">
                        <div className="h-4 w-32 bg-drift-100 animate-pulse rounded" />
                        <div className="h-4 w-28 bg-drift-100 animate-pulse rounded" />
                        <div className="h-6 w-20 bg-drift-100 animate-pulse rounded-full" />
                        <div className="h-4 w-24 bg-drift-100 animate-pulse rounded ml-auto" />
                    </div>
                ))}
            </div>
        </div>
    )
}
