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
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={Array.isArray(data) ? data : []} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis
                    dataKey="name"
                    stroke="#94A3B8"
                    fontSize={11}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                />
                <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    fontWeight={500}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip
                    formatter={(value: any) => [`₹${value}`, 'Revenue']}
                    cursor={{ fill: '#F0F9FF', opacity: 0.4 }}
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: '#0EA5E9', fontWeight: 600 }}
                    labelStyle={{ fontWeight: 700, marginBottom: '4px', color: '#0F172A' }}
                />
                <Bar
                    dataKey="total"
                    radius={[6, 6, 0, 0]}
                    fill="#0EA5E9"
                    fillOpacity={0.8}
                    activeBar={{ fill: '#0284C7', fillOpacity: 1 }}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
