"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

const tooltipStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }


export function Overview({ data = [] }: { data?: any[] }) {
    const hasRevenue = data && data.length > 0 && data.some((d: any) => d.total > 0)

    if (!hasRevenue) {
        return (
            <div className="h-[300px] w-full flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed gap-2">
                <p className="text-sm text-muted-foreground">No revenue data yet.</p>
                <p className="text-xs text-muted-foreground/60">Revenue insights will appear here once you start generating invoices.</p>
            </div>
        )
    }

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Array.isArray(data) ? data : []}>
                    <XAxis
                        dataKey="name"
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                        formatter={(value: any) => [`₹${value}`, 'Revenue']}
                        cursor={{ fill: 'var(--color-primary-light, rgba(0, 102, 255, 0.05))' }}
                        contentStyle={tooltipStyle}
                    />
                    <Bar
                        dataKey="total"
                        radius={[6, 6, 0, 0]}
                        className="fill-primary"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
