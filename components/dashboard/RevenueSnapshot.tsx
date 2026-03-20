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

    const hasRevenueData = monthlyRevenueData.some(d => d.total > 0)

    return (
        <Card className="border-drift-200 shadow-sm flex flex-col bg-white overflow-hidden rounded-xl">
            <CardHeader className="pb-3 bg-drift-50/10 border-b border-drift-50">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg font-bold text-slate-900">Revenue Insights</CardTitle>
                        <CardDescription className="text-xs font-medium text-drift-400">
                            Monthly realized revenue and trends
                        </CardDescription>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-4 sm:gap-1 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-drift-100">
                        <div className="flex flex-col items-start sm:items-end">
                            <span className="text-[9px] font-black text-drift-400 uppercase tracking-widest">Collected</span>
                            <span className="text-lg font-black tracking-tight text-slate-900 leading-tight">₹{revenue}</span>
                        </div>
                        <div className="flex flex-col items-start sm:items-end">
                            <span className="text-[9px] font-black text-drift-400 uppercase tracking-widest">Pending</span>
                            <span className="text-sm font-black text-amber-600 leading-tight">₹{pendingRevenue.toLocaleString('en-IN')}</span>
                        </div>

                        {!isDemo && (
                            <div className="flex items-center gap-1 mt-1 bg-drift-50/50 px-2 py-0.5 rounded-full border border-drift-100/50">
                                {isPositive && <TrendingUp className="h-3 w-3 text-emerald-500" />}
                                {isNegative && <TrendingDown className="h-3 w-3 text-rose-500" />}
                                {isNeutral && <Minus className="h-3 w-3 text-slate-400" />}

                                <span className={`text-[10px] font-black ${isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-slate-400'}`}>
                                    {isPositive ? '+' : ''}{revenueChange}%
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            {hasRevenueData ? (
                <CardContent className="p-0 pt-6">
                    <div className="h-[280px] sm:h-[320px] w-full px-2">
                        <Overview data={monthlyRevenueData} />
                    </div>
                </CardContent>
            ) : (
                <CardContent className="px-5 py-4">
                    <p className="text-xs text-drift-400 font-medium">Revenue data will appear after your first invoice</p>
                </CardContent>
            )}
        </Card>
    )
}
