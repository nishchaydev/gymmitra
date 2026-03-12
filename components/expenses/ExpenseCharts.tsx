'use client'

import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, ComposedChart, CartesianGrid, XAxis, YAxis, Area, Bar, Line } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#0066FF', '#0D9488', '#2563EB', '#0F766E', '#3B82F6', '#14B8A6', '#60A5FA', '#2DD4BF']

interface Expense {
    id: string
    amount: number
    category: string
    description: string
    date: string
}

interface TrendData {
    name: string
    revenue: number
    expenses: number
    profit: number
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180;
    // Position label slightly outside the center of the ring
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

export function ExpenseCharts({ expenses, trendData }: { expenses: Expense[], trendData: TrendData[] }) {
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

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0)

    if (expenses.length === 0 && (!trendData || trendData.length === 0)) return null

    return (
        <div className="space-y-6">
            <Card className="border border-drift-200 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.06)] rounded-[14px]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-[#64748B] uppercase tracking-wider">Expense Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-[300px] w-full relative">
                        {/* Center Total */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-[36px]">
                            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-tight">Total</span>
                            <span className="text-lg font-black text-[#0F172A]">₹{totalExpenses.toLocaleString('en-IN')}</span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any, name: any, props: any) => {
                                        const percent = ((Number(value) / totalExpenses) * 100).toFixed(1)
                                        return [`₹${Number(value).toLocaleString('en-IN')} (${percent}%)`, name]
                                    }}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    formatter={(value, entry: any) => {
                                        const itemData = chartData.find(d => d.name === value)
                                        const percent = itemData ? ((itemData.value / totalExpenses) * 100).toFixed(1) : 0
                                        return <span className="text-xs text-slate-700 font-medium">{value} <span className="text-slate-400">({percent}%)</span></span>
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="border border-drift-200 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.06)] rounded-[14px]">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold text-[#64748B] uppercase tracking-wider">Net Profit Trend</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="h-[300px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748B' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#64748B' }}
                                    tickFormatter={(val) => `₹${val.toLocaleString('en-IN')}`}
                                />
                                <Tooltip
                                    formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />

                                <Bar dataKey="revenue" name="Revenue" fill="#0066FF" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="expenses" name="Expenses" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#0D9488" strokeWidth={3} dot={{ r: 4, fill: '#0D9488', strokeWidth: 2, stroke: '#fff' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
