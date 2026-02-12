import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText } from "lucide-react"

const invoices = [
    {
        invoice: "INV001",
        paymentStatus: "Paid",
        totalAmount: "₹2,500.00",
        paymentMethod: "Credit Card",
        member: "Olivia Martin",
    },
    {
        invoice: "INV002",
        paymentStatus: "Pending",
        totalAmount: "₹1,500.00",
        paymentMethod: "UPI",
        member: "Jackson Lee",
    },
    {
        invoice: "INV003",
        paymentStatus: "Unpaid",
        totalAmount: "₹3,500.00",
        paymentMethod: "Bank Transfer",
        member: "Isabella Nguyen",
    },
    {
        invoice: "INV004",
        paymentStatus: "Paid",
        totalAmount: "₹4,500.00",
        paymentMethod: "Credit Card",
        member: "William Kim",
    },
    {
        invoice: "INV005",
        paymentStatus: "Paid",
        totalAmount: "₹5,500.00",
        paymentMethod: "UPI",
        member: "Sofia Davis",
    },
]

export function RecentInvoices() {
    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    Recent Invoices
                </CardTitle>
                <CardDescription>Latest generated invoices for memberships and products.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Invoice</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Member</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.map((invoice) => (
                            <TableRow key={invoice.invoice}>
                                <TableCell className="font-medium">{invoice.invoice}</TableCell>
                                <TableCell>
                                    <Badge variant={invoice.paymentStatus === 'Paid' ? 'default' : invoice.paymentStatus === 'Pending' ? 'secondary' : 'destructive'}>
                                        {invoice.paymentStatus}
                                    </Badge>
                                </TableCell>
                                <TableCell>{invoice.paymentMethod}</TableCell>
                                <TableCell>{invoice.member}</TableCell>
                                <TableCell className="text-right">{invoice.totalAmount}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
