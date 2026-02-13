import { Skeleton } from "@/components/ui/skeleton"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default function InvoicesLoading() {
    return (
        <div className="container mx-auto p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-[200px]" />
                    <Skeleton className="h-4 w-[300px]" />
                </div>
                <Skeleton className="h-10 w-[140px] rounded-md" />
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-[100px]" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                            <TableHead><Skeleton className="h-4 w-[80px]" /></TableHead>
                            <TableHead className="text-right"><Skeleton className="h-4 w-[100px] ml-auto" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-5 w-[120px]" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                                <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                                <TableCell className="text-right">
                                    <Skeleton className="h-5 w-[100px] ml-auto" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
