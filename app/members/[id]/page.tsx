import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { getShowcaseMember } from '@/lib/showcase-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Edit, CreditCard, Activity, Calendar, Clock } from 'lucide-react'
import { CheckInButton } from '@/components/members/check-in-button'
import { MemberQR } from '@/components/members/MemberQR'

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// ...

export default async function MemberDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const cookieStore = await cookies()
    const isDemo = !user && cookieStore.get('mitra_demo_mode')?.value === 'true'

    if (!user && !isDemo) {
        redirect("/login")
    }

    let gymId = 'demo'
    if (user && !isDemo) {
        const gym = await prisma.gymProfile.findUnique({
            where: { userId: user.id }
        })
        if (!gym) return <div className="p-8">Gym profile not found.</div>
        gymId = gym.id
    }

    const MS_PER_DAY = 24 * 60 * 60 * 1000
    const now = new Date()
    const yesterday = new Date(now.getTime() - MS_PER_DAY)

    const member = isDemo ? {
        ...getShowcaseMember(id),
        subscriptions: [{
            plan: { name: "Gold Annual" },
            status: "ACTIVE",
            startDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
            endDate: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
        }],
        invoices: [
            { id: "inv1", invoiceNumber: "INV001", issueDate: yesterday, total: 2500, paymentStatus: "PAID" },
            { id: "inv2", invoiceNumber: "INV002", issueDate: new Date(yesterday.getTime() - MS_PER_DAY * 30), total: 2500, paymentStatus: "PAID" }
        ],
        attendance: [
            { id: "att1", date: now, checkInTime: now },
            { id: "att2", date: yesterday, checkInTime: yesterday }
        ],
        emergencyName: "Rajesh Kumar",
        emergencyRelation: "Father",
        emergencyPhone: "9876500000"
    } as any : await prisma.member.findFirst({
        where: {
            id,
            gymId: gymId // Enforce ownership
        },
        include: {
            subscriptions: {
                include: { plan: true },
                orderBy: { endDate: 'desc' },
                take: 1
            },
            invoices: {
                orderBy: { issueDate: 'desc' },
                take: 5
            },
            attendance: {
                orderBy: { checkInTime: 'desc' },
                take: 5
            }
        }
    })

    if (!member) {
        notFound()
    }

    const activeSubscription = member.subscriptions[0]

    return (
        <div className="container mx-auto p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/members">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold">{member.name}</h1>
                    <Badge variant={member.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {member.status}
                    </Badge>
                </div>
                <div className="flex gap-2">
                    <CheckInButton memberId={member.id} />
                    <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" /> Edit Profile
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <div className="col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Phone</p>
                                <p>{member.phone}</p>
                            </div>
                            {member.email && (
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Email</p>
                                    <p>{member.email}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-medium text-gray-500">Joined Date</p>
                                <p>{new Date(member.joiningDate).toLocaleDateString()}</p>
                            </div>
                            {member.emergencyName && (
                                <div className="pt-4 border-t">
                                    <p className="text-sm font-medium text-gray-500 mb-2">Emergency Contact</p>
                                    <p>{member.emergencyName} ({member.emergencyRelation})</p>
                                    <p>{member.emergencyPhone}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <MemberQR memberId={member.id} memberName={member.name} />
                </div>

                <div className="col-span-2 space-y-6">
                    {/* Subscription Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">
                                Current Subscription
                            </CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {activeSubscription ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-2xl font-bold">{activeSubscription.plan.name}</h3>
                                    </div>
                                    <div className="mt-2">
                                        <Badge variant={activeSubscription.status === 'ACTIVE' ? 'default' : 'outline'}>
                                            {activeSubscription.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            {new Date(activeSubscription.startDate).toLocaleDateString()} - {new Date(activeSubscription.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-gray-500 mb-4">No active subscription</p>
                                    <Button size="sm">Assign Plan</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Attendance */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">
                                Recent Attendance
                            </CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {member.attendance.length > 0 ? (
                                <div className="space-y-4">
                                    {member.attendance.map((record: any) => (
                                        <div key={record.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">Checked in at: {new Date(record.checkInTime).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No recent check-ins</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Invoices */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-lg font-medium">
                                Recent Invoices
                            </CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {member.invoices.length > 0 ? (
                                <div className="space-y-4">
                                    {member.invoices.map((invoice: any) => (
                                        <div key={invoice.id} className="flex justify-between items-center border-b pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium">{invoice.invoiceNumber}</p>
                                                <p className="text-xs text-gray-500">{new Date(invoice.issueDate).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold">₹{Number(invoice.total).toFixed(2)}</p>
                                                <Badge variant="outline" className="text-xs">{invoice.paymentStatus}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No invoices found</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
