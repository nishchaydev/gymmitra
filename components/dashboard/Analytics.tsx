"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart, CartesianGrid, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MOCKUP_DATA } from "@/lib/showcase-data"

export function Analytics({ isDemo = false }: { isDemo?: boolean }) {
    const memberGrowthData = isDemo ? MOCKUP_DATA.analytics.memberGrowth : []
    const attendanceData = isDemo ? MOCKUP_DATA.analytics.attendance : []
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Member Growth</CardTitle>
                    <CardDescription>
                        Total active members over the last 7 months.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={memberGrowthData}>
                            <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="members" fill="#4FC3F7" radius={[4, 4, 0, 0]} className="fill-primary" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Peak Attendance</CardTitle>
                    <CardDescription>
                        Average gym usage by time of day.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <LineChart data={attendanceData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Legend />
                            <Line type="monotone" dataKey="morning" stroke="#4FC3F7" strokeWidth={2} activeDot={{ r: 8, fill: '#4FC3F7' }} name="Morning" />
                            <Line type="monotone" dataKey="evening" stroke="#3FB3E7" strokeWidth={2} activeDot={{ r: 8, fill: '#3FB3E7' }} name="Evening" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
