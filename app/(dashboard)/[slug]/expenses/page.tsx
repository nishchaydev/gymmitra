import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getAuthGym } from '@/lib/auth'
import { getIsDemo } from '@/lib/demo'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { ExpensesList } from '@/components/expenses/ExpensesList'
import { ExpenseCharts } from '@/components/expenses/ExpenseCharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button' // Added for the new button
import { IndianRupee, TrendingDown, Calendar, Download } from 'lucide-react'

export const metadata = { title: "Expenses" };

export default async function ExpensesPage({
    params
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params
    const isDemo = await getIsDemo(slug)
    const auth = await getAuthGym()

    if (!auth && !isDemo) redirect('/login')

    // Tenant isolation fix
    if (auth && !isDemo && auth.gym.slug !== slug) {
        redirect('/login')
    }

    const expenseModel = prisma.expense
    if (!expenseModel) {
        throw new Error("Expense model is missing from Prisma schema!")
    }

    const rawExpenses = isDemo ? [] : await expenseModel.findMany({
        where: { gymId: auth?.gym.id },
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

    const monthlyRevenueResult = isDemo ? { _sum: { amountPaid: 450000 } } : await prisma.invoice.aggregate({
        where: { gymId: auth?.gym.id, paymentStatus: { in: ['PAID', 'PARTIAL'] }, deletedAt: null, createdAt: { gte: startOfMonth } },
        _sum: { amountPaid: true }
    })
    const monthlyRevenue = Number(monthlyRevenueResult._sum.amountPaid || 0)

    const netIncome = monthlyRevenue - monthlyExpenses

    // Fetch last 6 months data for trend chart
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const recentInvoices = isDemo ? [] : await prisma.invoice.findMany({
        where: {
            gymId: auth?.gym.id,
            paymentStatus: { in: ['PAID', 'PARTIAL'] },
            deletedAt: null,
            createdAt: { gte: sixMonthsAgo }
        }
    });

    const recentExpenses = isDemo ? [] : rawExpenses.filter((e: any) => new Date(e.date) >= sixMonthsAgo);

    const trendData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('en-US', { month: 'short' });
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
        const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

        const monthRev = recentInvoices
            .filter((inv) => inv.createdAt >= monthStart && inv.createdAt <= monthEnd)
            .reduce((acc, inv) => acc + Number(inv.amountPaid), 0);

        const monthExp = recentExpenses
            .filter((exp: any) => new Date(exp.date) >= monthStart && new Date(exp.date) <= monthEnd)
            .reduce((acc, exp: any) => acc + Number(exp.amount), 0);

        trendData.push({
            name: monthName,
            revenue: monthRev,
            expenses: monthExp,
            profit: monthRev - monthExp
        });
    }

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Expense Management</h1>
                    <p className="text-drift-400 font-medium">Track your gym overheads and operational costs</p>
                </div>
                <div className="flex gap-2">
                    <a href={`/api/reports/download?type=expenses`} download>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" /> Export CSV
                        </Button>
                    </a>
                    <ExpenseForm slug={slug} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border border-drift-200 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.06)] rounded-[14px]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">All-Time Expenses</CardTitle>
                        <div className="bg-[#E6F0FF] rounded-lg p-2.5">
                            <TrendingDown className="h-4 w-4 text-[#0066FF]" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tight text-[#0F172A]">₹{totalExpenses.toLocaleString('en-IN')}</div>
                    </CardContent>
                </Card>

                <Card className="border border-drift-200 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.06)] rounded-[14px]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">This Month</CardTitle>
                        <div className="bg-[#E6F0FF] rounded-lg p-2.5">
                            <Calendar className="h-4 w-4 text-[#0066FF]" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-black tracking-tight text-[#0F172A]">₹{monthlyExpenses.toLocaleString('en-IN')}</div>
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
                        <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-tighter">Monthly Net Income (Rev - Exp)</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                    <ExpensesList slug={slug} initialData={expenses} />
                </div>
                <div className="flex flex-col h-full">
                    <div className="sticky top-6">
                        <ExpenseCharts expenses={expenses} trendData={trendData} />
                    </div>
                </div>
            </div>
        </div>
    )
}
