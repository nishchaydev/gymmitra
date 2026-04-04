'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ReceiptText, User, ShoppingBag, CreditCard } from 'lucide-react'
import { createInvoice } from '../actions'
import { SuccessCheckmark } from '@/components/ui/success-animation'
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'

export default function NewInvoiceForm({
    members,
    membershipPlans = [],
    products = [],
    taxEnabled = true,
    defaultTaxPercentage = 18
}: {
    members: any[],
    membershipPlans?: any[],
    products?: any[],
    taxEnabled?: boolean,
    defaultTaxPercentage?: number
}) {
    const router = useRouter()
    const params = useParams()
    const slug = params?.slug as string || 'gym'

    const [selectedMember, setSelectedMember] = useState<string>('')
    const [walkInName, setWalkInName] = useState('')
    const [walkInPhone, setWalkInPhone] = useState('')
    const [walkInEmail, setWalkInEmail] = useState('')
    const [walkInAddress, setWalkInAddress] = useState('')
    const [items, setItems] = useState<{
        id: string,
        description: string,
        quantity: number,
        unitPrice: number,
        type: 'MEMBERSHIP' | 'PRODUCT' | 'OTHER',
        referenceId?: string
    }[]>([
        { id: 'initial', description: '', quantity: 1, unitPrice: 0, type: 'OTHER' }
    ])
    const [discount, setDiscount] = useState(0)
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH')
    const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PARTIAL' | 'PENDING'>('PAID')
    const [amountPaid, setAmountPaid] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [invoiceTaxPercentage, setInvoiceTaxPercentage] = useState(taxEnabled ? defaultTaxPercentage : 0)

    const addItem = () => setItems([...items, { id: crypto.randomUUID(), description: '', quantity: 1, unitPrice: 0, type: 'OTHER' }])
    const removeItem = (id: string) => setItems(items.filter((item) => item.id !== id))
    const updateItem = (id: string, field: string, value: any) => {
        setItems(items.map(item => {
            if (item.id !== id) return item;

            if (field === 'type') {
                return { ...item, type: value, description: '', unitPrice: 0, referenceId: undefined };
            }

            if (field === 'referenceId') {
                if (item.type === 'MEMBERSHIP') {
                    const plan = membershipPlans.find(p => p.id === value);
                    return { ...item, referenceId: value, description: plan?.name || '', unitPrice: Number(plan?.price || 0) };
                }
                if (item.type === 'PRODUCT') {
                    const product = products.find(p => p.id === value);
                    return { ...item, referenceId: value, description: product?.name || '', unitPrice: Number(product?.price || 0) };
                }
            }

            return { ...item, [field]: value };
        }))
    }

    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)
    const afterDiscount = Math.max(0, subtotal - discount)
    const taxAmount = taxEnabled ? Math.round((afterDiscount * invoiceTaxPercentage) / 100) : 0
    const total = afterDiscount + taxAmount

    React.useEffect(() => {
        if (paymentStatus === 'PAID') {
            setAmountPaid(total)
        } else if (paymentStatus === 'PENDING') {
            setAmountPaid(0)
        }
    }, [total, paymentStatus])

    // Client-side validation
    const hasItems = items.length > 0 && items.every(item =>
        item.description.trim().length > 0 &&
        item.quantity > 0 &&
        item.unitPrice >= 0
    )
    // Validate phone: require at least 7 digits in total, ignoring spaces/formatting
    const phoneRegex = /^(?=(?:\D*\d){7})[+\d][\d\s\-().]{6,19}$/
    const hasValidWalkIn = selectedMember === 'WALK-IN'
        ? walkInName.trim().length > 0 && phoneRegex.test(walkInPhone.trim())
        : true
    const isValid = hasItems && hasValidWalkIn

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <SuccessCheckmark />
                <h2 className="text-2xl font-bold">Invoice Generated!</h2>
                <p className="text-slate-400">Redirecting to view invoice...</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4 h-full relative">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
                            <ReceiptText className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-drift-900">Create New Invoice</h1>
                            <p className="text-drift-500 text-sm font-medium">Generate professional invoices for members and products</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        {/* Member Selection */}
                        <Card className="bg-white border-drift-200 shadow-sm border-t-4 border-t-ion-500">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-drift-900">
                                    <User className="w-5 h-5 text-primary-500" />
                                    Member (Optional)
                                </CardTitle>
                                <CardDescription className="text-drift-500">Select a member to associate this invoice with</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Select value={selectedMember} onValueChange={setSelectedMember}>
                                    <SelectTrigger className="bg-drift-50 border-drift-200 text-drift-900 h-12 focus:ring-primary-500">
                                        <SelectValue placeholder="Walk-in Customer" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white border-drift-200 text-drift-900">
                                        <SelectItem value="WALK-IN">Walk-in Customer</SelectItem>
                                        {members.map(member => (
                                            <SelectItem key={member.id} value={member.id}>{member.name} ({member.memberId})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedMember === 'WALK-IN' && (
                                    <div className="mt-6 p-4 bg-drift-50 rounded-xl border border-drift-200 space-y-4">
                                        <div className="flex-1 space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-drift-600 uppercase">Customer Name</Label>
                                                <Input
                                                    value={walkInName}
                                                    onChange={(e) => setWalkInName(e.target.value)}
                                                    placeholder="Nishchay Gupta"
                                                    className="bg-white border-drift-200 focus:ring-primary-500"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-drift-600 uppercase">Phone Number</Label>
                                                    <Input
                                                        value={walkInPhone}
                                                        onChange={(e) => setWalkInPhone(e.target.value)}
                                                        placeholder="9876543210"
                                                        className="bg-white border-drift-200 focus:ring-primary-500"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-bold text-drift-600 uppercase">Email Address</Label>
                                                    <Input
                                                        value={walkInEmail}
                                                        onChange={(e) => setWalkInEmail(e.target.value)}
                                                        placeholder="john@example.com"
                                                        className="bg-white border-drift-200 focus:ring-primary-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold text-drift-600 uppercase">Address</Label>
                                                <Input
                                                    value={walkInAddress}
                                                    onChange={(e) => setWalkInAddress(e.target.value)}
                                                    placeholder="123 Main St, City"
                                                    className="bg-white border-drift-200 focus:ring-primary-500"
                                                />
                                            </div>
                                        </div>                </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Items Section */}
                        <Card className="bg-white border-drift-200 shadow-sm border-t-4 border-t-ion-500">
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-drift-900">
                                        <ShoppingBag className="w-5 h-5 text-primary-500" />
                                        Invoice Items
                                    </CardTitle>
                                    <CardDescription className="text-drift-500">Add memberships, products or other items</CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addItem}
                                    className="border-primary-500 text-primary-600 hover:bg-primary-50 font-bold"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Add Item
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6 px-4 md:px-6">
                                {items.map((item) => (
                                    <div key={item.id} className="p-4 bg-drift-50/50 rounded-2xl border border-drift-200 group space-y-4 relative">
                                        <div className="flex flex-col md:grid md:grid-cols-12 gap-4">
                                            <div className="md:col-span-4 space-y-1.5">
                                                <Label className="text-[10px] text-drift-500 uppercase font-black tracking-wider">Item Category</Label>
                                                <Select
                                                    value={item.type}
                                                    onValueChange={(val) => updateItem(item.id, 'type', val)}
                                                >
                                                    <SelectTrigger className="bg-white border-drift-200 h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="MEMBERSHIP">Membership Plan</SelectItem>
                                                        <SelectItem value="PRODUCT">Inventory Product</SelectItem>
                                                        <SelectItem value="OTHER">Generic / Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="md:col-span-8 space-y-1.5">
                                                <Label className="text-[10px] text-drift-500 uppercase font-black tracking-wider">
                                                    {item.type === 'MEMBERSHIP' ? 'Select Plan' : item.type === 'PRODUCT' ? 'Select Product' : 'Description'}
                                                </Label>
                                                {item.type === 'OTHER' ? (
                                                    <Input
                                                        placeholder="e.g., Personal Training Session"
                                                        value={item.description}
                                                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                                        className="bg-white border-drift-200 h-10"
                                                    />
                                                ) : (
                                                    <Select
                                                        value={item.referenceId}
                                                        onValueChange={(val) => updateItem(item.id, 'referenceId', val)}
                                                    >
                                                        <SelectTrigger className="bg-white border-drift-200 h-10">
                                                            <SelectValue placeholder={item.type === 'MEMBERSHIP' ? "Choose Plan" : "Choose Product"} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {item.type === 'MEMBERSHIP' ? (
                                                                membershipPlans.map(p => (
                                                                    <SelectItem key={p.id} value={p.id}>{p.name} - ₹{Number(p.price)}</SelectItem>
                                                                ))
                                                            ) : (
                                                                products.map(p => (
                                                                    <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.stock}) - ₹{Number(p.price)}</SelectItem>
                                                                ))
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-row md:grid md:grid-cols-12 gap-4 items-end">
                                            <div className="flex-1 md:col-span-3 space-y-1.5">
                                                <Label className="text-[10px] text-drift-500 uppercase font-black tracking-wider">Qty</Label>
                                                <Input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                                                    className="bg-white border-drift-200 h-10 font-bold"
                                                />
                                            </div>
                                            <div className="flex-[2] md:col-span-5 space-y-1.5">
                                                <Label className="text-[10px] text-drift-500 uppercase font-black tracking-wider">Unit Price (₹)</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-drift-400 font-bold">₹</span>
                                                    <Input
                                                        type="number"
                                                        value={item.unitPrice}
                                                        onChange={(e) => updateItem(item.id, 'unitPrice', Math.max(0, parseFloat(e.target.value) || 0))}
                                                        className="bg-white border-drift-200 pl-8 h-10 font-black text-primary-600"
                                                    />
                                                </div>
                                            </div>
                                            <div className="md:col-span-4 flex justify-end">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold h-10 px-3 md:px-4 rounded-xl transition-colors shrink-0"
                                                    disabled={items.length === 1}
                                                >
                                                    <Trash2 className="w-4 h-4 md:mr-2" />
                                                    <span className="hidden md:inline">Remove</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        <Card className="bg-white border-drift-200 shadow-sm border-t-4 border-t-ion-500 sticky top-24">
                            <CardHeader>
                                <CardTitle className="text-drift-900">Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4 pt-4 border-t border-drift-100">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-drift-500 font-medium">Subtotal</span>
                                        <span className="text-drift-900 font-bold">₹{subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold text-drift-500 uppercase tracking-wider">Discount (₹)</Label>
                                        <Input
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(Number(e.target.value))}
                                            className="bg-drift-50 border-drift-200 focus:ring-primary-500 h-10 font-bold text-primary-600"
                                        />
                                    </div>
                                    {/* Tax section — only visible when gym has tax enabled */}
                                    {taxEnabled && (
                                        <div className="space-y-3 pt-3 border-t border-drift-100">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-bold text-drift-500 uppercase tracking-wider">GST Rate (%)</Label>
                                                <div className="relative w-20">
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={100}
                                                        step={0.5}
                                                        value={invoiceTaxPercentage}
                                                        onChange={(e) => setInvoiceTaxPercentage(Math.min(100, Math.max(0, Number(e.target.value))))}
                                                        className="bg-drift-50 border-drift-200 h-8 text-xs font-bold text-right pr-6"
                                                    />
                                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-drift-400 text-xs font-bold">%</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-drift-500 font-medium">Tax ({invoiceTaxPercentage}%)</span>
                                                <span className="text-drift-700 font-bold">₹{taxAmount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center pt-4 border-t border-drift-200">
                                        <span className="text-drift-900 font-black uppercase tracking-tight">Total Amount</span>
                                        <span className="text-2xl font-black text-primary-600">₹{total.toLocaleString()}</span>
                                    </div>

                                    {/* Payment Status */}
                                    <div className="space-y-2 pt-4 border-t border-drift-100">
                                        <Label className="text-[10px] font-bold text-drift-500 uppercase tracking-wider">Payment Status</Label>
                                        <Select value={paymentStatus} onValueChange={(val: 'PAID' | 'PARTIAL' | 'PENDING') => setPaymentStatus(val)}>
                                            <SelectTrigger className="bg-drift-50 border-drift-200 h-10 font-bold">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PAID">Paid in Full</SelectItem>
                                                <SelectItem value="PARTIAL">Partial Payment</SelectItem>
                                                <SelectItem value="PENDING">Pending</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {paymentStatus === 'PARTIAL' && (
                                        <div className="space-y-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Amount Paid Now (₹)</Label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 font-bold">₹</span>
                                                    <Input
                                                        type="number"
                                                        value={amountPaid}
                                                        onChange={(e) => setAmountPaid(Math.min(total, Math.max(0, Number(e.target.value))))}
                                                        className="bg-white border-amber-200 pl-8 h-10 font-black text-amber-700 focus:ring-amber-500"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-amber-600 font-medium">Balance Due</span>
                                                <span className="text-amber-700 font-black text-lg">₹{Math.max(0, total - amountPaid).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}

                                    {paymentStatus === 'PENDING' && (
                                        <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-rose-600 font-medium">Full Amount Pending</span>
                                                <span className="text-rose-700 font-black text-lg">₹{total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white border-drift-200 shadow-sm border-t-4 border-t-ion-500">
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-drift-500 uppercase">Payment Method</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            type="button"
                                            variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                                            className={paymentMethod === 'CASH' ? 'bg-primary-500 text-white hover:bg-primary-600' : 'border-drift-200 hover:bg-drift-50 text-drift-700'}
                                            onClick={() => setPaymentMethod('CASH')}
                                        >
                                            Cash
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={paymentMethod === 'UPI' ? 'default' : 'outline'}
                                            className={paymentMethod === 'UPI' ? 'bg-primary-500 text-white hover:bg-primary-600' : 'border-drift-200 hover:bg-drift-50 text-drift-700'}
                                            onClick={() => setPaymentMethod('UPI')}
                                        >
                                            UPI
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-black h-14 rounded-2xl text-sm sm:text-base shadow-xl shadow-primary-600/30 active:scale-[0.97] transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
                                    disabled={isSubmitting || !isValid}
                                    onClick={async () => {
                                        setIsSubmitting(true)
                                        try {
                                            const result = await createInvoice({
                                                memberId: selectedMember === 'WALK-IN' || !selectedMember ? undefined : selectedMember,
                                                walkInName: (selectedMember === 'WALK-IN' || !selectedMember) ? walkInName.trim() || "Walk-in Customer" : undefined,
                                                walkInPhone: (selectedMember === 'WALK-IN' || !selectedMember) ? walkInPhone.trim() || undefined : undefined,
                                                walkInEmail: (selectedMember === 'WALK-IN' || !selectedMember) ? walkInEmail.trim() || undefined : undefined,
                                                walkInAddress: (selectedMember === 'WALK-IN' || !selectedMember) ? walkInAddress.trim() || undefined : undefined,
                                                paymentMethod,
                                                paymentStatus,
                                                amountPaid: paymentStatus === 'PARTIAL' ? amountPaid : undefined,
                                                items: items.map(item => ({
                                                    description: item.description,
                                                    quantity: item.quantity,
                                                    unitPrice: item.unitPrice,
                                                    type: item.type
                                                })),
                                                discount,
                                                taxPercentage: taxEnabled ? invoiceTaxPercentage : 0,
                                                type: 'SALE',
                                            }) as { success: boolean, id?: string, error?: string }

                                            if (result?.error) {
                                                toast.error(result.error)
                                                return
                                            }

                                            if (result?.success) {
                                                setSuccess(true)
                                                toast.success("Invoice generated successfully")
                                                setTimeout(() => {
                                                    if (result.id) {
                                                        router.push(`/${slug}/invoices/${result.id}`)
                                                    } else {
                                                        router.push(`/${slug}/invoices`)
                                                    }
                                                }, 2000)
                                            }

                                        } catch (err) {
                                            console.error("Error creating invoice", err)
                                            toast.error("Error creating invoice")
                                        } finally {
                                            setIsSubmitting(false)
                                        }
                                    }}
                                >
                                    {isSubmitting ? 'Generating...' : 'Generate & Print Invoice'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
