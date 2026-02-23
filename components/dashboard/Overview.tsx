"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { SHOWCASE_STATS } from "@/lib/showcase-data"

const tooltipStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }


export function Overview({ data = SHOWCASE_STATS.overviewData }: { data?: any[] }) {
    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
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
                        fill="var(--color-primary, #0066FF)"
                        radius={[6, 6, 0, 0]}
                        className="fill-primary"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
