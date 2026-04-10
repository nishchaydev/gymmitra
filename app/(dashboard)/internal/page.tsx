'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LayoutDashboard, Building, Settings, Sparkles, RefreshCcw } from "lucide-react"
import AdminStatsCards from "./components/AdminStatsCards"
import GymManagementTable from "./components/GymManagementTable"
import ManualTrialGenerator from "./components/ManualTrialGenerator"
import RegistrationCodeManager from "./components/RegistrationCodeManager"
import SystemBroadcast from "./components/SystemBroadcast"
import { Button } from '@/components/ui/button'

export default function InternalAdminPage() {
    const [stats, setStats] = useState<any>(null)
    const [gyms, setGyms] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const fetchData = async () => {
        setIsRefreshing(true)
        try {
            const [statsRes, gymsRes] = await Promise.all([
                fetch('/api/admin/stats'),
                fetch('/api/admin/gyms')
            ])
            
            if (statsRes.ok) setStats(await statsRes.json())
            if (gymsRes.ok) setGyms(await gymsRes.json())
        } catch (err) {
            console.error("Failed to fetch admin data", err)
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50/50">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        System Dashboard
                        <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0">ADMIN</Badge>
                    </h1>
                    <p className="text-slate-500">
                        Operational overview and management of the GymMitra SaaS ecosystem.
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchData} 
                    disabled={isRefreshing}
                    className="bg-white shadow-sm"
                >
                    <RefreshCcw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Metrics Grid */}
            <AdminStatsCards stats={stats} isLoading={isLoading} />

            {/* Main Content Area */}
            <Tabs defaultValue="overview" className="space-y-6">
                <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md py-2 px-1 rounded-xl shadow-sm border border-slate-200/50">
                    <TabsList className="bg-transparent gap-4">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="gyms" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
                            <Building className="w-4 h-4 mr-2" />
                            All Clients
                        </TabsTrigger>
                        <TabsTrigger value="tools" className="data-[state=active]:bg-white data-[state=active]:shadow-sm px-6">
                            <Settings className="w-4 h-4 mr-2" />
                            Operations
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="shadow-sm border-slate-200/60">
                            <CardHeader>
                                <CardTitle className="text-lg">Recent Signups</CardTitle>
                                <CardDescription>Latest gyms to join the platform in the last 7 days.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <GymManagementTable gyms={gyms.slice(0, 5)} onUpdate={fetchData} />
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-indigo-600 text-white shadow-lg border-0 overflow-hidden relative">
                            <Sparkles className="absolute right-[-20px] top-[-20px] w-48 h-48 text-white/10 rotate-12" />
                            <CardHeader>
                                <CardTitle className="text-xl">Platform Growth</CardTitle>
                                <CardDescription className="text-white/60">System-wide performance indicators.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm text-indigo-100">
                                        <span>Conversion Rate</span>
                                        <span>{stats?.totalGyms ? ((stats.totalRevenue / stats.totalGyms) / 100).toFixed(1) : 0}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-white rounded-full w-[12%]" />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-sm text-indigo-100 italic">
                                        &quot;Monitor active trials closely. Reach out to gyms stuck at Step 1 to improve conversion.&quot;
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="gyms" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <GymManagementTable gyms={gyms} onUpdate={fetchData} />
                </TabsContent>

                <TabsContent value="tools" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                        <ManualTrialGenerator />
                        <SystemBroadcast />
                    </div>
                    <div className="mt-6">
                        <RegistrationCodeManager />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function Badge({ children, variant, className }: { children: React.ReactNode, variant?: string, className?: string }) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
            {children}
        </span>
    )
}
