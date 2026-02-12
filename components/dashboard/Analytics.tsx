"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Line, LineChart, CartesianGrid, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const memberGrowthData = [
    { name: "Jan", members: 120 },
    { name: "Feb", members: 135 },
    { name: "Mar", members: 160 },
    { name: "Apr", members: 210 },
    { name: "May", members: 255 },
    { name: "Jun", members: 310 },
    { name: "Jul", members: 380 },
]

const attendanceData = [
    { name: "Mon", morning: 45, evening: 80 },
    { name: "Tue", morning: 50, evening: 95 },
    { name: "Wed", morning: 48, evening: 85 },
    { name: "Thu", morning: 60, evening: 90 },
    { name: "Fri", morning: 55, evening: 110 },
    { name: "Sat", morning: 70, evening: 60 },
    { name: "Sun", morning: 30, evening: 20 },
]

export function Analytics() {
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
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="members" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
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
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Legend />
                            <Line type="monotone" dataKey="morning" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} name="Morning" />
                            <Line type="monotone" dataKey="evening" stroke="#f97316" strokeWidth={2} activeDot={{ r: 8 }} name="Evening" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    )
}
