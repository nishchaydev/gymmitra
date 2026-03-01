import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function AttendanceLoading() {
    return (
        <div
            className="container mx-auto p-8 space-y-6"
            aria-busy="true"
            aria-live="polite"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                </div>
                <Skeleton className="h-10 w-[160px] rounded-md" />
            </div>

            {/* Search bar skeleton */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border shadow-sm">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-[120px]" />
            </div>

            {/* Table skeleton */}
            <div className="rounded-md border bg-white overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50">
                            <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-[120px]" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-[140px]" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <span className="sr-only">Loading attendance records...</span>
        </div>
    )
}
