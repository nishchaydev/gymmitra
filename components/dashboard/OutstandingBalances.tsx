'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageCircle, CreditCard, User } from 'lucide-react'
import { getWhatsAppLink, templates } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'

interface OutstandingBalancesProps {
    data: any[]
    gymName: string
    slug: string
}

export function OutstandingBalances({ data, gymName, slug }: OutstandingBalancesProps) {
    if (!data || data.length === 0) return null

    const handleWhatsApp = (inv: any) => {
        const message = templates.paymentOverdue(
            inv.member?.name || inv.walkInName || 'Customer',
            Number(inv.balanceDue),
            gymName
        )
        const phone = inv.member?.phone || inv.walkInPhone
        if (phone) {
            window.open(getWhatsAppLink(phone, message), '_blank')
        }
    }

    return (
        <Card className="border border-drift-200 bg-white shadow-[0_1px_8px_rgba(0,0,0,0.06)] rounded-[14px] overflow-hidden">
            <CardHeader className="pl-4 py-4 bg-amber-50/30">
                <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-500" />
                    Outstanding Balances
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-drift-100">
                    {data.map((inv) => (
                        <div key={inv.id} className="p-4 hover:bg-drift-50 transition-colors flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-drift-100 flex items-center justify-center text-drift-600">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">
                                        {inv.member?.name || inv.walkInName || 'Walk-in Customer'}
                                    </p>
                                    <p className="text-xs text-drift-400 font-medium">
                                        Invoice #{inv.invoiceNumber}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm font-black text-amber-600">₹{Number(inv.balanceDue).toLocaleString()}</p>
                                    <p className="text-[10px] font-bold text-drift-400 uppercase tracking-wider">Due</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleWhatsApp(inv)}
                                    className="h-9 w-9 text-green-600 hover:bg-green-50 rounded-full border border-green-100 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Send WhatsApp Nudge"
                                    disabled={!(inv.member?.phone || inv.walkInPhone)}
                                >
                                    <MessageCircle className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
