import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function InvoicesPage() {
    const invoices = await prisma.invoice.findMany({
        orderBy: { issueDate: 'desc' },
        include: {
            member: {
                select: { name: true }
            }
        }
    })

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
                <div className="flex items-center space-x-2">
                    <Link href="/invoices/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Generate Invoice
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Invoices</CardTitle>
                    <CardDescription>
                        Manage and view all generated invoices.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Invoice #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Member</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total Amount</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center">
                                        No invoices found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                invoices.map((invoice) => (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                        <TableCell>{format(new Date(invoice.issueDate), 'MMM d, yyyy')}</TableCell>
                                        <TableCell>{invoice.member?.name || 'Walk-in Customer'}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{invoice.type}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                invoice.paymentStatus === 'PAID' ? 'default' :
                                                    invoice.paymentStatus === 'PENDING' ? 'secondary' : 'destructive'
                                            }>
                                                {invoice.paymentStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            ₹{parseFloat(invoice.total.toString()).toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">View</Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
