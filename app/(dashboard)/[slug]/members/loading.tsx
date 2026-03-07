import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function MembersLoading() {
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
                <Skeleton className="h-10 w-[140px] rounded-md" />
            </div>

            {/* Search and filter bar skeleton */}
            <div className="flex gap-4 items-center bg-white dark:bg-slate-900 p-4 rounded-lg border dark:border-slate-800 shadow-sm transition-colors">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-[150px]" />
            </div>

            {/* Table skeleton */}
            <div className="rounded-md border dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 dark:bg-slate-800/10">
                            <TableHead><Skeleton className="h-4 w-[150px]" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-[120px]" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-[120px]" /></TableHead>
                            <TableHead className="text-right"><Skeleton className="h-4 w-[60px] ml-auto" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <TableRow key={i} className="dark:border-slate-800">
                                <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-[140px]" /></TableCell>
                                <TableCell className="text-right">
                                    <Skeleton className="h-8 w-[60px] ml-auto rounded-md" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Visual indicator for Screen Readers */}
            <span className="sr-only">Loading member list...</span>
        </div>
    )
}
