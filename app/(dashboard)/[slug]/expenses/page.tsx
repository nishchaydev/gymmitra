import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { ExpensesList } from '@/components/expenses/ExpensesList'
import { ExpenseCharts } from '@/components/expenses/ExpenseCharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IndianRupee, TrendingDown, Calendar } from 'lucide-react'

export default async function ExpensesPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const auth = await getAuthGym()
    if (!auth) redirect('/login')

    // Tenant isolation fix
    if (auth.gym.slug !== slug) {
        redirect('/login')
    }

    // @ts-ignore - Check for schema drift loud during development
    const expenseModel = prisma.expense
    if (!expenseModel) {
        throw new Error("Expense model is missing from Prisma schema!")
    }

    const rawExpenses = await expenseModel.findMany({
        where: { gymId: auth.gym.id },
        orderBy: { date: 'desc' }
    })

    // Sanitize Decimal to Number for Client Components
    const expenses = rawExpenses.map((e: any) => ({
        ...e,
        amount: Number(e.amount),
        date: e.date.toISOString(),
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString(),
    }))

    const totalExpenses = expenses.reduce((acc: number, curr: any) => acc + curr.amount, 0)

    // This month's expenses
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const monthlyExpenses = expenses
        .filter((e: any) => new Date(e.date) >= startOfMonth)
        .reduce((acc: number, curr: any) => acc + curr.amount, 0)

    const totalRevenueResult = await prisma.invoice.aggregate({
        where: { gymId: auth.gym.id, paymentStatus: 'PAID', deletedAt: null },
        _sum: { total: true }
    })
    const totalRevenue = Number(totalRevenueResult._sum.total || 0)

    const netIncome = totalRevenue - totalExpenses

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Expense Management</h1>
                    <p className="text-drift-400 font-medium">Track your gym overheads and operational costs</p>
                </div>
                <ExpenseForm slug={slug} />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-l-4 border-l-red-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-black text-drift-400 uppercase tracking-widest">Total Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900">₹{totalExpenses.toLocaleString('en-IN')}</div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-black text-drift-400 uppercase tracking-widest">This Month</CardTitle>
                        <Calendar className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black text-slate-900">₹{monthlyExpenses.toLocaleString('en-IN')}</div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 text-white shadow-lg">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest underline decoration-primary">Financial Health</CardTitle>
                        <IndianRupee className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-black ${netIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {netIncome >= 0 ? '+' : '-'}₹{Math.abs(netIncome).toLocaleString('en-IN')}
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">Net Income (Rev - Exp)</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                    <ExpensesList slug={slug} initialData={expenses} />
                </div>
                <div>
                    <ExpenseCharts expenses={expenses} />
                </div>
            </div>
        </div>
    )
}
