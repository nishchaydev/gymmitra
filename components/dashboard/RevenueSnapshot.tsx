import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Overview } from '@/components/dashboard/Overview'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface RevenueSnapshotProps {
    revenue: string
    revenueChange: number
    pendingRevenue: number
    monthlyRevenueData: { name: string; total: number }[]
    isDemo?: boolean
}

export function RevenueSnapshot({
    revenue,
    revenueChange,
    pendingRevenue,
    monthlyRevenueData,
    isDemo
}: RevenueSnapshotProps) {
    const isPositive = revenueChange > 0
    const isNegative = revenueChange < 0
    const isNeutral = revenueChange === 0

    return (
        <Card className="border-slate-200 shadow-sm h-full flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg font-bold">Revenue Insights</CardTitle>
                        <CardDescription>
                            Monthly realized revenue and trends
                        </CardDescription>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">Collected</span>
                            <span className="text-xl font-bold tracking-tight text-slate-900">₹{revenue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">Pending</span>
                            <span className="text-sm font-bold text-amber-600">₹{pendingRevenue.toLocaleString('en-IN')}</span>
                        </div>
                        {!isDemo && (
                            <div className="flex items-center gap-1 mt-1">
                                {isPositive && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                                {isNegative && <TrendingDown className="h-4 w-4 text-rose-500" />}
                                {isNeutral && <Minus className="h-4 w-4 text-slate-400" />}

                                <span className={`text-xs font-bold ${isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-slate-400'}`}>
                                    {isPositive ? '+' : ''}{revenueChange}%
                                </span>
                                <span className="text-xs text-slate-400">vs last month</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pl-0 sm:pl-2 flex-grow mt-4">
                <div className="h-[300px] sm:h-[350px] w-full">
                    <Overview data={monthlyRevenueData} />
                </div>
            </CardContent>
        </Card>
    )
}
