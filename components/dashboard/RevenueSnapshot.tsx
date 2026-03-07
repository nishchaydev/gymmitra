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
        <Card className="border-drift-200 shadow-sm h-full flex flex-col bg-white overflow-hidden">
            <CardHeader className="pb-2 bg-drift-50/10 border-b border-drift-50">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg font-black text-slate-900">Revenue Insights</CardTitle>
                        <CardDescription className="text-xs font-medium text-drift-400">
                            Monthly realized revenue and trends
                        </CardDescription>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-drift-400 uppercase tracking-widest">Collected</span>
                            <span className="text-xl font-black tracking-tight text-slate-900">₹{revenue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-drift-400 uppercase tracking-widest">Pending</span>
                            <span className="text-sm font-black text-amber-600">₹{pendingRevenue.toLocaleString('en-IN')}</span>
                        </div>
                        {!isDemo && (
                            <div className="flex items-center gap-1 mt-1">
                                {isPositive && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                                {isNegative && <TrendingDown className="h-3.5 w-3.5 text-rose-500" />}
                                {isNeutral && <Minus className="h-3.5 w-3.5 text-slate-400" />}

                                <span className={`text-[10px] font-black ${isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-slate-400'}`}>
                                    {isPositive ? '+' : ''}{revenueChange}%
                                </span>
                                <span className="text-[10px] font-bold text-drift-300 uppercase tracking-tighter">vs prev</span>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pl-0 pr-0 flex-grow mt-4">
                <div className="h-[300px] sm:h-[350px] w-full px-2">
                    <Overview data={monthlyRevenueData} />
                </div>
            </CardContent>
        </Card>
    )
}
