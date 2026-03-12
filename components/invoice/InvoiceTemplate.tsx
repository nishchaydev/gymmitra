'use client'

import React from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Dumbbell, Phone, Mail, MapPin } from 'lucide-react'
import { UpiQrCode } from './UpiQrCode'
import { generateUpiQrData } from '@/lib/invoice-utils'

interface InvoiceItem {
    description: string
    quantity: number
    unitPrice: number
    total: number
}

interface InvoiceTemplateProps {
    invoiceNumber: string
    date: string
    paymentMethod: 'CASH' | 'UPI'
    gymInfo: {
        name: string
        address: string
        phone: string
        email: string
        upiId?: string
        logoUrl?: string
        termsAndConditions?: string | null
    }
    memberInfo: {
        name: string
        phone: string
        address?: string
    }
    items: InvoiceItem[]
    subtotal: number
    taxPercentage?: number
    taxAmount?: number
    discount: number
    total: number
    amountPaid?: number
    balanceDue?: number
    paymentStatus?: string
}

export function InvoiceTemplate({
    invoiceNumber,
    date,
    paymentMethod,
    gymInfo,
    memberInfo,
    items,
    subtotal,
    taxPercentage,
    taxAmount,
    discount,
    total,
    amountPaid,
    balanceDue,
    paymentStatus
}: InvoiceTemplateProps) {
    const upiQrData = gymInfo.upiId ? generateUpiQrData(gymInfo.upiId, paymentStatus === 'PARTIAL' && balanceDue ? balanceDue : total, gymInfo.name, invoiceNumber) : null

    return (
        <div className="bg-white p-4 sm:p-8 w-full max-w-[800px] mx-auto shadow-sm border print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print:break-inside-avoid print:page-break-inside-avoid text-drift-900 overflow-x-hidden sm:overflow-visible" id="invoice-template">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-4 mb-12">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-primary">
                        <Dumbbell className="w-8 h-8 sm:w-10 sm:h-10" />
                        <h1 className="text-xl sm:text-3xl font-black tracking-tighter uppercase break-words break-all sm:break-normal">{gymInfo.name}</h1>
                    </div>
                    <div className="text-sm text-slate-500 space-y-1">
                        <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {gymInfo.address}</div>
                        <div className="flex items-center gap-2"><Phone className="w-3 h-3" /> {gymInfo.phone}</div>
                        <div className="flex items-center gap-2"><Mail className="w-3 h-3" /> {gymInfo.email}</div>
                    </div>
                </div>
                <div className="sm:text-right text-left w-full sm:w-auto">
                    <h2 className="text-2xl sm:text-4xl font-black text-slate-200 uppercase tracking-widest mb-2 sm:mb-4">INVOICE</h2>
                    <div className="space-y-1 text-sm">
                        <div className="font-bold text-slate-900">{invoiceNumber}</div>
                        <div className="text-slate-500">{date}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 mb-12">
                {/* Bill To */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Bill To</h3>
                    <div className="space-y-1">
                        <div className="text-lg font-bold text-slate-900">{memberInfo.name}</div>
                        <div className="text-sm text-slate-500">{memberInfo.phone}</div>
                        {memberInfo.address && <div className="text-sm text-slate-500 max-w-[200px]">{memberInfo.address}</div>}
                    </div>
                </div>

                {/* Payment Info */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Payment Details</h3>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Method:</span>
                            <span className="font-bold text-slate-900">{paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Status:</span>
                            {(() => {
                                const computedStatus = paymentStatus || 'PAID';
                                return (
                                    <span className={`font-bold transition-colors ${computedStatus === 'PAID' ? 'text-emerald-600' :
                                        computedStatus === 'PARTIAL' ? 'text-amber-600' :
                                            'text-rose-600'
                                        }`}>
                                        {computedStatus}
                                    </span>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Table (Hidden on Mobile) */}
            <div className="hidden sm:block mb-12">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-y border-slate-200">
                            <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Description</th>
                            <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Qty</th>
                            <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Unit Price</th>
                            <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {items.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 px-4 text-sm font-medium text-slate-900">{item.description}</td>
                                <td className="py-4 px-4 text-sm text-slate-500 text-center">{item.quantity}</td>
                                <td className="py-4 px-4 text-sm text-slate-500 text-right whitespace-nowrap">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                                <td className="py-4 px-4 text-sm font-bold text-slate-900 text-right whitespace-nowrap">₹{item.total.toLocaleString('en-IN')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Line Items Cards (Hidden on Desktop) */}
            <div className="sm:hidden space-y-4 mb-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b pb-2">Line Items</h3>
                {items.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex flex-col gap-3">
                        <div className="text-sm font-bold text-slate-900">{item.description}</div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Qty: {item.quantity}</span>
                            <span className="text-slate-500">@ ₹{item.unitPrice.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-200 pt-3">
                            <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
                            <span className="text-base font-black text-slate-900 whitespace-nowrap">₹{item.total.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Summary */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-8">
                <div className="space-y-6">
                    {paymentMethod === 'UPI' && upiQrData && (
                        <UpiQrCode value={upiQrData} size={120} />
                    )}
                    {gymInfo.termsAndConditions ? (
                        <div className="text-[10px] text-slate-400 max-w-[300px] leading-relaxed italic">
                            <p className="font-bold mb-1 not-italic">TERMS & CONDITIONS</p>
                            {gymInfo.termsAndConditions.split('\n').map(l => l.trim()).filter(Boolean).map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>
                    ) : (
                        <div className="text-[10px] text-slate-400 max-w-[300px] leading-relaxed italic">
                            <p className="font-bold mb-1 not-italic">TERMS & CONDITIONS</p>
                            <p>1. Membership registration fees are non-refundable.</p>
                            <p>2. Please keep this invoice for your records.</p>
                            <p>3. Subscription transfers are subject to management approval.</p>
                        </div>
                    )}
                </div>

                <div className="w-full sm:w-[300px] space-y-3">
                    <div className="flex justify-between text-sm py-2">
                        <span className="text-slate-500 font-medium">Subtotal</span>
                        <span className="text-slate-900 font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-sm py-2">
                            <span className="text-slate-500 font-medium">Discount</span>
                            <span className="text-emerald-600 font-bold">-₹{discount.toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    {(taxAmount ?? 0) > 0 && (
                        <div className="flex justify-between text-sm py-2">
                            <span className="text-slate-500 font-medium">GST ({taxPercentage ?? 18}%)</span>
                            <span className="text-slate-900 font-bold">₹{taxAmount?.toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center py-4 border-t-2 border-slate-900">
                        <span className="text-base sm:text-lg font-black text-slate-900 uppercase">Grand Total</span>
                        <span className="text-xl sm:text-2xl font-black text-primary underline decoration-primary/20 underline-offset-8">₹{total.toLocaleString('en-IN')}</span>
                    </div>

                    {(amountPaid !== undefined && amountPaid > 0) && (
                        <div className="flex justify-between text-sm py-1">
                            <span className="text-slate-500 font-medium">Amount Paid</span>
                            <span className="text-emerald-600 font-bold">₹{amountPaid.toLocaleString('en-IN')}</span>
                        </div>
                    )}

                    {(balanceDue !== undefined && balanceDue > 0) && (
                        <div className="flex justify-between text-sm py-1 bg-amber-50 px-2 rounded -mx-2">
                            <span className="text-amber-700 font-bold uppercase text-[10px] tracking-wide">Balance Due</span>
                            <span className="text-rose-600 font-black">₹{balanceDue.toLocaleString('en-IN')}</span>
                        </div>
                    )}

                    <div className="pt-8 text-right opacity-30">
                        <div className="text-[10px] font-bold uppercase tracking-widest mb-1 italic">Authorized Signatory</div>
                        <div className="h-12 w-24 ml-auto border-b border-slate-900"></div>
                    </div>
                </div>
            </div>

            {/* Bottom Accent */}
            <div className="mt-20 pt-8 border-t border-slate-100 flex justify-between items-center opacity-50 print:mt-10">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Generated via GymMitra</div>
                <div className="flex gap-2 text-primary font-black text-lg italic tracking-tighter">
                    <Dumbbell className="w-5 h-5" />
                    {gymInfo.name}
                </div>
            </div>
        </div>
    )
}
