import { cookies } from 'next/headers'
import { getShowcaseMember } from '@/lib/showcase-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Edit, CreditCard, Activity, Calendar, Clock, MessageCircle, ReceiptText } from 'lucide-react'
import { CheckInButton } from '@/components/members/check-in-button'
import { MemberQR } from '@/components/members/MemberQR'
import { getWhatsAppLink, templates } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { redirect } from 'next/navigation'
import { MemberRepository } from '@/src/modules/members/repository'
import { computeMemberFlags } from '@/src/modules/members/member-flags'
import { serializeDecimals, toNumber } from '@/src/modules/shared/serializers'

export const dynamic = 'force-dynamic'

export default async function MemberDetailPage({
    params,
}: {
    params: Promise<{ slug: string; id: string }>
}) {
    const { slug, id } = await params
    const cookieStore = await cookies()
    const envDemoEnabled = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === 'true'
    const isDemo = envDemoEnabled && cookieStore.get('mitra_demo_mode')?.value === 'true'

    const auth = await import('@/lib/auth').then(mod => mod.getAuthGym())

    if (!auth && !isDemo) {
        redirect("/login")
    }

    let gymId = 'demo'
    let gymName = 'your gym'
    if (auth && !isDemo) {
        gymId = auth.gym.id
        gymName = auth.gym.name
    }

    const MS_PER_DAY = 24 * 60 * 60 * 1000
    const now = new Date()
    const yesterday = new Date(now.getTime() - MS_PER_DAY)

    // Use MemberRepository instead of direct Prisma access
    const rawMember = isDemo ? {
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
    } as any : await MemberRepository.getMemberWithSubscriptions(id, gymId)

    if (!rawMember) {
        notFound()
    }

    // Serialize Decimal fields to plain numbers at the boundary
    const member = serializeDecimals(rawMember)

    // Compute business logic flags — UI only renders, never decides
    const flags = computeMemberFlags(member as any)

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
                        <Badge variant={flags.effectiveStatus === 'ACTIVE' ? 'default' : 'secondary'} className={cn(
                            "rounded-full font-black text-[10px] uppercase px-2 w-fit h-5",
                            flags.effectiveStatus === 'ACTIVE' ? "bg-emerald-500 hover:bg-emerald-600 text-white" :
                            flags.effectiveStatus === 'EXPIRED' ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"
                        )}>
                            {flags.effectiveStatus}
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
                {/* Profile Information (Always visible or sidebar) */}
                <div className="col-span-1 space-y-6">
                    <Card className="border-drift-200 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="bg-drift-50/50 border-b border-drift-100 py-4">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-500">Profile Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-drift-400 uppercase tracking-wider mb-1">Phone</p>
                                    <p className="font-bold text-slate-900">{member.phone}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-drift-400 uppercase tracking-wider mb-1">Gender</p>
                                    <p className="font-bold text-slate-900 uppercase text-xs">{member.gender || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-drift-400 uppercase tracking-wider mb-1">Joined</p>
                                    <p className="font-bold text-slate-900">{new Date(member.joiningDate).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-drift-400 uppercase tracking-wider mb-1">Birthday</p>
                                    <p className="font-bold text-slate-900">{member.dob ? new Date(member.dob).toLocaleDateString() : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-drift-400 uppercase tracking-wider mb-1">Weight</p>
                                    <p className="font-bold text-slate-900">{member.weight ? `${member.weight} kg` : 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-drift-400 uppercase tracking-wider mb-1">Height</p>
                                    <p className="font-bold text-slate-900">{member.height ? `${member.height} cm` : 'N/A'}</p>
                                </div>
                            </div>
                            {member.email && (
                                <div className="pt-2">
                                    <p className="text-[10px] font-black text-drift-400 uppercase tracking-wider mb-1">Email</p>
                                    <p className="font-bold text-slate-900 truncate">{member.email}</p>
                                </div>
                            )}
                            {member.emergencyName && (
                                <div className="pt-4 border-t border-drift-100 mt-4">
                                    <p className="text-[10px] font-black text-drift-400 uppercase tracking-wider mb-1">Emergency</p>
                                    <p className="font-bold text-slate-900">{member.emergencyName}</p>
                                    <p className="text-sm font-medium text-slate-600">{member.emergencyPhone}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="hidden md:block">
                        <MemberQR memberId={member.id} memberName={member.name} />
                    </div>

                    {flags.hasOutstandingBalance && (
                        <Card className="border-t-4 border-t-rose-500 bg-rose-50/30 rounded-2xl overflow-hidden shadow-sm">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-[10px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                    <CreditCard className="w-3 h-3" />
                                    Outstanding balance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="text-3xl font-black text-slate-900">₹{flags.totalOutstanding.toLocaleString()}</div>
                                    <Button
                                        asChild
                                        size="sm"
                                        className="w-full bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-wider gap-2 h-10 rounded-xl shadow-sm"
                                    >
                                        <Link
                                            href={getWhatsAppLink(member.phone, templates.paymentOverdue(member.name, flags.totalOutstanding, gymName))}
                                            target="_blank"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Remind
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Subscriptions, Attendance, and Invoices in Tabs */}
                <div className="col-span-1 md:col-span-2">
                    <Tabs defaultValue="membership" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 mb-6 h-12 p-1 bg-slate-100/50 rounded-xl">
                            <TabsTrigger value="membership" className="rounded-lg font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Plan</TabsTrigger>
                            <TabsTrigger value="attendance" className="rounded-lg font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Log</TabsTrigger>
                            <TabsTrigger value="billing" className="rounded-lg font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Bills</TabsTrigger>
                        </TabsList>

                        <TabsContent value="membership" className="space-y-6 outline-none">
                            <Card className="border-drift-200 shadow-sm rounded-2xl overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-primary-50/20 border-l-4 border-l-primary">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-primary-700">
                                        Current Plan
                                    </CardTitle>
                                    <Activity className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent className="pt-6">
                                    {flags.hasActivePlan ? (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                                    {flags.currentPlanName}
                                                </h3>
                                                <Badge className={cn(
                                                    "rounded-full font-black text-[10px] uppercase px-3 h-6",
                                                    flags.effectiveStatus === 'ACTIVE' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                                                )}>
                                                    {flags.effectiveStatus}
                                                </Badge>
                                            </div>
                                            {member.subscriptions[0] && (
                                                <div className="flex items-center gap-3 text-xs text-slate-600 font-bold bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                    <Calendar className="h-4 w-4 text-primary" />
                                                    <span>
                                                        {`${new Date(member.subscriptions[0].startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — ${new Date(member.subscriptions[0].endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10">
                                            <p className="text-slate-500 mb-6 font-medium italic">No active membership plan found</p>
                                            <Button size="lg" asChild className="bg-primary hover:bg-primary-600 text-white font-black uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-primary/20">
                                                <Link href={`/${slug}/invoices/new?memberId=${member.id}`}>Activate Plan</Link>
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="md:hidden">
                                <MemberQR memberId={member.id} memberName={member.name} />
                            </div>
                        </TabsContent>

                        <TabsContent value="attendance" className="outline-none">
                            <Card className="border-drift-200 shadow-sm rounded-2xl overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-amber-50/20 border-l-4 border-l-amber-500">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-amber-700">
                                        Recent Check-ins
                                    </CardTitle>
                                    <Clock className="h-4 w-4 text-amber-500" />
                                </CardHeader>
                                <CardContent className="pt-0 px-0">
                                    {member.attendance.length > 0 ? (
                                        <div className="divide-y divide-slate-50">
                                            {member.attendance.map((record: any) => (
                                                <div key={record.id} className="flex justify-between items-center px-6 py-4 hover:bg-slate-50/50 transition-colors">
                                                    <p className="font-bold text-slate-900 text-sm">{new Date(record.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-tighter bg-primary-50 px-2.5 py-1 rounded-lg">
                                                        {new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 px-6">
                                            <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Activity className="h-6 w-6 text-slate-300" />
                                            </div>
                                            <p className="text-sm text-slate-400 font-medium italic">No recent check-ins recorded</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="billing" className="outline-none">
                            <Card className="border-drift-200 shadow-sm rounded-2xl overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-slate-50 border-l-4 border-l-slate-900 border-b border-slate-100">
                                    <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-900">
                                        Transaction History
                                    </CardTitle>
                                    <CreditCard className="h-4 w-4 text-slate-900" />
                                </CardHeader>
                                <CardContent className="pt-0 px-0">
                                    {member.invoices.length > 0 ? (
                                        <div className="divide-y divide-slate-50">
                                            {member.invoices.map((invoice: any) => (
                                                <div key={invoice.id} className="flex justify-between items-center px-6 py-5 hover:bg-slate-50 transition-colors group">
                                                    <div className="space-y-1">
                                                        <p className="font-black text-slate-900 text-sm">#{invoice.invoiceNumber}</p>
                                                        <p className="text-[10px] font-black text-drift-400 uppercase tracking-widest">{new Date(invoice.issueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                                    </div>
                                                    <div className="text-right space-y-2">
                                                        <p className="font-black text-slate-900 text-sm">₹{toNumber(invoice.total).toLocaleString('en-IN')}</p>
                                                        <div className="flex items-center justify-end gap-2">
                                                            {toNumber(invoice.balanceDue) > 0 && (
                                                                <span className="text-[10px] font-black text-rose-600 uppercase tracking-tight">
                                                                    Due: ₹{toNumber(invoice.balanceDue).toLocaleString('en-IN')}
                                                                </span>
                                                            )}
                                                            <Badge className={cn(
                                                                "text-[9px] font-black uppercase px-2 h-5 shadow-none border-0",
                                                                invoice.paymentStatus === 'PAID' && "bg-emerald-50 text-emerald-700",
                                                                invoice.paymentStatus === 'PARTIAL' && "bg-amber-50 text-amber-700",
                                                                invoice.paymentStatus === 'PENDING' && "bg-rose-50 text-rose-700",
                                                            )} variant="outline">
                                                                {invoice.paymentStatus}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 px-6">
                                            <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <ReceiptText className="h-6 w-6 text-slate-300" />
                                            </div>
                                            <p className="text-sm text-slate-400 font-medium italic">No transaction history found</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
