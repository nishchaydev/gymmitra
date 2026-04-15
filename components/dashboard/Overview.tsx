"use client"

import { 
    Area, 
    AreaChart, 
    ResponsiveContainer, 
    XAxis, 
    YAxis, 
    Tooltip, 
    CartesianGrid 
} from "recharts"

export function Overview({ data = [] }: { data?: any[] }) {
    const safeData = Array.isArray(data) ? data : [];
    const hasRevenue = safeData.length > 0 && safeData.some((d: any) => d.total > 0)

    if (!hasRevenue) {
        return (
            <div className="h-[300px] w-full flex flex-col items-center justify-center bg-drift-50/50 rounded-3xl border border-dashed border-drift-200 gap-2">
                <p className="text-sm font-bold text-drift-500">No revenue data yet.</p>
                <p className="text-xs text-drift-400">Insights will appear here once you start generating invoices.</p>
            </div>
        )
    }

    return (
        <div className="h-[300px] w-full p-2">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1e293b" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#1e293b" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={10}
                        fontWeight={800}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                        dy={10}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={10}
                        fontWeight={800}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                            if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
                            if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
                            return `₹${value}`;
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            borderRadius: '16px',
                            border: 'none',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                            fontSize: '12px',
                            fontWeight: '800',
                            padding: '12px 16px',
                            backgroundColor: '#fff'
                        }}
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#1e293b"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorTotal)"
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
