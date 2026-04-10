'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, Users, CreditCard, Clock, TrendingUp } from "lucide-react"

interface Stats {
    totalGyms: number
    totalMembers: number
    totalRevenue: number
    activeTrials: number
    newGymsLast7Days: number
}

interface Props {
    stats: Stats | null
    isLoading: boolean
}

export default function AdminStatsCards({ stats, isLoading }: Props) {
    if (isLoading || !stats) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="animate-pulse bg-slate-50 border-slate-200">
                        <CardHeader className="h-24" />
                    </Card>
                ))}
            </div>
        )
    }

    const cards = [
        {
            title: "Total Gyms",
            value: stats.totalGyms,
            desc: "Onboarded since start",
            icon: Building2,
            color: "text-blue-600",
            bg: "bg-blue-50"
        },
        {
            title: "Total Members",
            value: stats.totalMembers,
            desc: "Across all tenants",
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-50"
        },
        {
            title: "Platform Revenue",
            value: `₹${stats.totalRevenue.toLocaleString()}`,
            desc: "Verified global sales",
            icon: CreditCard,
            color: "text-green-600",
            bg: "bg-green-50"
        },
        {
            title: "Active Trials",
            value: stats.activeTrials,
            desc: "Gyms in 30-day window",
            icon: Clock,
            color: "text-orange-600",
            bg: "bg-orange-50"
        }
    ]

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <Card key={card.title} className="hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <div className={`p-2 rounded-lg ${card.bg}`}>
                            <card.icon className={`w-4 h-4 ${card.color}`} />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{card.value}</div>
                        <p className="text-xs text-muted-foreground mt-1">{card.desc}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
