"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

const tooltipStyle = {
    borderRadius: '12px',
    border: '1px solid var(--drift-200)',
    boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
    padding: '12px'
}


export function Overview({ data = [] }: { data?: any[] }) {
    const hasRevenue = data && data.length > 0 && data.some((d: any) => d.total > 0)

    if (!hasRevenue) {
        return (
            <div className="h-[300px] w-full flex flex-col items-center justify-center bg-drift-50/50 rounded-xl border border-dashed border-drift-200 gap-2">
                <p className="text-sm text-drift-500">No revenue data yet.</p>
                <p className="text-xs text-drift-400">Revenue insights will appear here once you start generating invoices.</p>
            </div>
        )
    }

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                        dataKey="name"
                        stroke="#94a3b8"
                        fontSize={10}
                        fontWeight={700}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={10}
                        fontWeight={700}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                            if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
                            if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
                            if (value >= 1000) return `₹${(value / 1000).toFixed(0)}k`;
                            return `₹${value}`;
                        }}
                    />
                    <Tooltip
                        cursor={{ fill: '#f1f5f9', opacity: 0.4 }}
                        contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            fontSize: '11px',
                            fontWeight: 'bold'
                        }}
                        formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Bar
                        dataKey="total"
                        fill="currentColor"
                        radius={[6, 6, 0, 0]}
                        className="fill-primary"
                        barSize={Math.min(32, 240 / (data?.length || 1))}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
