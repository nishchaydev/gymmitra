import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { getShowcaseMember } from '@/lib/showcase-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Edit, CreditCard, Activity, Calendar, Clock, MessageCircle } from 'lucide-react'
import { CheckInButton } from '@/components/members/check-in-button'
import { MemberQR } from '@/components/members/MemberQR'
import { getWhatsAppLink, templates } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MemberDetailPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>
}) {
    const { slug, id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const cookieStore = await cookies()
    const isDemo = !user && cookieStore.get('mitra_demo_mode')?.value === 'true'

    if (!user && !isDemo) {
        redirect("/login")
    }

    let gymId = 'demo'
    let gymName = 'your gym'
    if (user && !isDemo) {
        const gym = await prisma.gymProfile.findUnique({
            where: { userId: user.id }
        })
        if (!gym) return <div className="p-8">Gym profile not found.</div>
        gymId = gym.id
        gymName = gym.name
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
            { id: "inv1", invoiceNumber: "INV001", issueDate: yesterday, total: 2500, paymentStatus: "PAID", balanceDue: 0 },
            { id: "inv2", invoiceNumber: "INV002", issueDate: new Date(yesterday.getTime() - MS_PER_DAY * 30), total: 2500, paymentStatus: "PAID", balanceDue: 0 }
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
                take: 10
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

    // Calculate total outstanding balance
    const outstandingInvoices = member.invoices.filter((inv: any) =>
        inv.paymentStatus === 'PARTIAL' || inv.paymentStatus === 'PENDING'
    )
    const totalOutstanding = outstandingInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.balanceDue) || 0), 0)

    return (
        <div className="container mx-auto p-4 md:p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 md:gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full h-8 w-8 shrink-0">
                        <Link href={`/${slug}/members`}>
                            <ChevronLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
                        <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-none">{member.name}</h1>
                        <Badge variant={member.status === 'ACTIVE' ? 'default' : 'secondary'} className={cn(
                            "rounded-full font-black text-[10px] uppercase px-2 w-fit h-5",
                            member.status === 'ACTIVE' ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                        )}>
                            {member.status}
                        </Badge>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="flex-1 md:flex-none">
                        <CheckInButton memberId={member.id} />
                    </div>
                    <Button variant="outline" asChild className="flex-1 md:flex-none h-10 md:h-11 rounded-xl font-bold border-drift-200">
                        <Link href={`/${slug}/members/${member.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Profile
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Card */}
                <div className="col-span-1 space-y-6">
                    <Card className="border-drift-200 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-drift-50/50 border-b border-drift-100">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-600">Profile Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div>
                                <p className="text-[10px] font-black text-drift-400 uppercase tracking-wider mb-1">Phone</p>
                                <p className="font-bold text-slate-900">{member.phone}</p>
                            </div>
                            {member.email && (
                                <div>
                                    <p className="text-[10px] font-black text-drift-400 uppercase tracking-wider mb-1">Email</p>
                                    <p className="font-bold text-slate-900">{member.email}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-[10px] font-black text-drift-400 uppercase tracking-wider mb-1">Joined Date</p>
                                <p className="font-bold text-slate-900">{new Date(member.joiningDate).toLocaleDateString()}</p>
                            </div>
                            {member.emergencyName && (
                                <div className="pt-4 border-t border-drift-100 mt-4">
                                    <p className="text-[10px] font-black text-drift-400 uppercase tracking-wider mb-1">Emergency Contact</p>
                                    <p className="font-bold text-slate-900">{member.emergencyName} ({member.emergencyRelation})</p>
                                    <p className="text-sm font-medium text-slate-600">{member.emergencyPhone}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <MemberQR memberId={member.id} memberName={member.name} />

                    {totalOutstanding > 0 && (
                        <Card className="border-t-4 border-t-amber-500 bg-amber-50/50 rounded-2xl overflow-hidden shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                    <CreditCard className="w-4 h-4" />
                                    Total Outstanding
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="text-3xl font-black text-slate-900 whitespace-nowrap">₹{totalOutstanding.toLocaleString()}</div>
                                    <p className="text-xs text-amber-700 font-medium">
                                        Due from {outstandingInvoices.length} {outstandingInvoices.length === 1 ? 'invoice' : 'invoices'}.
                                    </p>
                                    <Button
                                        asChild
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-wider gap-2 h-11 rounded-xl shadow-md active:scale-95 transition-all"
                                    >
                                        <Link
                                            href={getWhatsAppLink(member.phone, templates.paymentOverdue(member.name, totalOutstanding, gymName))}
                                            target="_blank"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Send Reminder
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <div className="col-span-1 md:col-span-2 space-y-6">
                    {/* Subscription Card */}
                    <Card className="border-drift-200 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-primary-50/20 border-l-4 border-l-primary">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary-700">
                                Current Subscription
                            </CardTitle>
                            <Activity className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent className="pt-6">
                            {activeSubscription ? (
                                <div className="space-y-4">
                                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{activeSubscription.plan.name}</h3>
                                        <Badge className={cn(
                                            "rounded-full font-black text-[10px] uppercase px-3 w-fit",
                                            activeSubscription.status === 'ACTIVE' ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-rose-500 hover:bg-rose-600 text-white"
                                        )}>
                                            {activeSubscription.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-slate-600 font-bold bg-drift-50 p-3 rounded-xl border border-drift-100">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <span>
                                            {new Date(activeSubscription.startDate).toLocaleDateString()} — {new Date(activeSubscription.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-slate-500 mb-4 font-medium italic">No active subscription</p>
                                    <Button size="sm" className="bg-primary hover:bg-primary-600 text-white font-bold rounded-full px-6">Assign Plan</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Attendance */}
                    <Card className="border-drift-200 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-amber-50/20 border-l-4 border-l-amber-500">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-700">
                                Recent Attendance
                            </CardTitle>
                            <Clock className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent className="pt-6 px-0">
                            {member.attendance.length > 0 ? (
                                <div className="space-y-1">
                                    {member.attendance.map((record: any) => (
                                        <div key={record.id} className="flex justify-between items-center border-b border-drift-50 px-6 py-4 hover:bg-drift-50/30 transition-colors last:border-0">
                                            <div>
                                                <p className="font-black text-slate-900">{new Date(record.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-primary uppercase tracking-tighter bg-primary-50 px-2 py-1 rounded-lg">Checked in at {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic text-center py-8">No recent check-ins recorded</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Invoices */}
                    <Card className="border-drift-200 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-slate-50 border-l-4 border-l-slate-900 text-slate-900 border-b border-slate-100">
                            <CardTitle className="text-sm font-black uppercase tracking-widest">
                                Transaction History
                            </CardTitle>
                            <CreditCard className="h-4 w-4" />
                        </CardHeader>
                        <CardContent className="pt-6 px-0">
                            {member.invoices.length > 0 ? (
                                <div className="space-y-0">
                                    {member.invoices.map((invoice: any) => (
                                        <div key={invoice.id} className="flex justify-between items-center border-b border-drift-50 px-6 py-4 hover:bg-drift-50 transition-colors last:border-0 group">
                                            <div>
                                                <p className="font-black text-slate-900 text-sm">#{invoice.invoiceNumber}</p>
                                                <p className="text-[10px] font-black text-drift-400 uppercase tracking-widest">{new Date(invoice.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <p className="font-black text-slate-900">₹{Number(invoice.total).toLocaleString('en-IN')}</p>
                                                <div className="flex items-center gap-2">
                                                    {invoice.balanceDue > 0 && (
                                                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-tight">
                                                            Due: ₹{Number(invoice.balanceDue).toLocaleString('en-IN')}
                                                        </span>
                                                    )}
                                                    <Badge className={cn(
                                                        "text-[10px] font-black uppercase px-2 shadow-none border-0",
                                                        invoice.paymentStatus === 'PAID' && "bg-emerald-100 text-emerald-700",
                                                        invoice.paymentStatus === 'PARTIAL' && "bg-amber-100 text-amber-700",
                                                        invoice.paymentStatus === 'PENDING' && "bg-rose-100 text-rose-700",
                                                    )} variant="outline">
                                                        {invoice.paymentStatus}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic text-center py-8">No transaction history found</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
