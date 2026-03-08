'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Trash2, ReceiptText } from 'lucide-react'
import { deleteExpense } from '@/app/(dashboard)/[slug]/expenses/actions'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

interface Expense {
    id: string
    amount: number
    category: string
    description: string
    date: Date
}

export function ExpensesList({
    slug,
    initialData
}: {
    slug: string,
    initialData: Expense[]
}) {
    async function handleDelete(id: string) {
        if (!confirm("Are you sure you want to delete this expense?")) return

        const res = await deleteExpense(slug, id)
        if (res.success) {
            toast.success("Expense deleted")
        } else {
            toast.error(res.error || "Failed to delete expense")
        }
    }

    if (initialData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <ReceiptText className="h-6 w-6 text-slate-300" />
                </div>
                <h3 className="font-bold text-slate-900">No expenses recorded</h3>
                <p className="text-sm text-slate-500 max-w-[250px] mt-1">Start tracking your gym overheads to calculate accurate net profit.</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/50">
                        <TableHead className="font-bold">Date</TableHead>
                        <TableHead className="font-bold">Category</TableHead>
                        <TableHead className="font-bold">Description</TableHead>
                        <TableHead className="text-right font-bold">Amount</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialData.map((expense) => (
                        <TableRow key={expense.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell className="text-sm">
                                {new Date(expense.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-0 text-[10px] font-bold uppercase tracking-wider">
                                    {expense.category.replaceAll('_', ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-sm font-medium text-slate-700">
                                {expense.description}
                            </TableCell>
                            <TableCell className="text-right font-black text-slate-900">
                                ₹{Number(expense.amount).toLocaleString('en-IN')}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Delete expense"
                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(expense.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
