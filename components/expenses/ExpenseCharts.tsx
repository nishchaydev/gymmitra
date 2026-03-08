'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#6366f1', '#ec4899', '#94a3b8']

interface Expense {
    id: string
    amount: number
    category: string
    description: string
    date: string
}

export function ExpenseCharts({ expenses }: { expenses: Expense[] }) {
    const dataByCategory = expenses.reduce((acc: any, curr) => {
        const cat = curr.category.replaceAll('_', ' ')
        if (!acc[cat]) acc[cat] = 0
        acc[cat] += curr.amount
        return acc
    }, {})

    const chartData = Object.keys(dataByCategory).map(name => ({
        name,
        value: dataByCategory[name]
    })).sort((a, b) => b.value - a.value)

    if (expenses.length === 0) return null

    return (
        <Card className="shadow-sm overflow-hidden border-slate-200">
            <CardHeader className="bg-slate-50/50 pb-2">
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Expense Distribution</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
