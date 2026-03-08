"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart, CartesianGrid, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MOCKUP_DATA } from "@/lib/showcase-data"

const tooltipStyle = { borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }

export function Analytics({ isDemo = false, initialData }: { isDemo?: boolean, initialData?: { memberGrowth: any[], attendance: any[], isEstimated?: boolean } }) {
    const memberGrowthData = isDemo ? MOCKUP_DATA.analytics.memberGrowth : (initialData?.memberGrowth || [])
    const attendanceData = isDemo ? MOCKUP_DATA.analytics.attendance : (initialData?.attendance || [])

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-1 md:col-span-2 lg:col-span-4">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Member Growth
                        {initialData?.isEstimated && !isDemo && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Estimated</span>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Total active members over the last 7 months.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={memberGrowthData}>
                            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} allowDecimals={false} domain={[0, 'auto']} />
                            <Tooltip
                                cursor={{ fill: 'var(--color-primary-light, rgba(0, 102, 255, 0.05))' }}
                                contentStyle={tooltipStyle}
                            />
                            <Bar dataKey="members" radius={[6, 6, 0, 0]} className="fill-primary" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Peak Attendance
                        {initialData?.isEstimated && !isDemo && (
                            <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Estimated</span>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Average gym usage by time of day.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={attendanceData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend />
                            <Line type="monotone" dataKey="morning" stroke="var(--color-primary, #0066FF)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8, fill: 'var(--color-primary, #0066FF)' }} name="Morning" />
                            <Line type="monotone" dataKey="evening" stroke="var(--color-midnight, #1E3A8A)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8, fill: 'var(--color-midnight, #1E3A8A)' }} name="Evening" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
