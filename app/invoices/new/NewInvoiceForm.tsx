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
import { useRouter } from 'next/navigation'

export default function NewInvoiceForm({ members, taxPercentage = 18 }: { members: any[], taxPercentage?: number }) {
    const router = useRouter()
    const [selectedMember, setSelectedMember] = useState<string>('')
    const [walkInName, setWalkInName] = useState('')
    const [walkInPhone, setWalkInPhone] = useState('')
    const [walkInEmail, setWalkInEmail] = useState('')
    const [walkInAddress, setWalkInAddress] = useState('')
    const [items, setItems] = useState<{ description: string, quantity: number, unitPrice: number, type: 'MEMBERSHIP' | 'PRODUCT' | 'OTHER' }[]>([{ description: '', quantity: 1, unitPrice: 0, type: 'OTHER' }])
    const [discount, setDiscount] = useState(0)
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)

    const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0, type: 'OTHER' }])
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))
    const updateItem = (index: number, field: string, value: string | number) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)
    const subtotalAfterDiscount = Math.max(0, subtotal - discount)
    const taxAmount = (subtotalAfterDiscount * taxPercentage) / 100
    const total = subtotalAfterDiscount + taxAmount

    // Client-side validation
    const hasItems = items.length > 0 && items.every(item =>
        item.description.trim().length > 0 &&
        item.quantity > 0 &&
        item.unitPrice >= 0
    )
    // Validate phone: at least 7 digits plus optional formatting chars
    const phoneRegex = /^[+\d][\d\s\-().]{6,19}$/
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
                        <div className="w-12 h-12 rounded-xl bg-[#4FC3F7]/10 flex items-center justify-center text-[#4FC3F7]">
                            <ReceiptText className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white">Create New Invoice</h1>
                            <p className="text-slate-400 text-sm font-medium">Generate professional invoices for members and products</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-8">
                        {/* Member Selection */}
                        <Card className="bg-slate-900 border-slate-800 shadow-2xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-white">
                                    <User className="w-5 h-5 text-[#4FC3F7]" />
                                    Member (Optional)
                                </CardTitle>
                                <CardDescription className="text-slate-400">Select a member to associate this invoice with</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Select value={selectedMember} onValueChange={setSelectedMember}>
                                    <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-12">
                                        <SelectValue placeholder="Walk-in Customer" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                        <SelectItem value="WALK-IN">Walk-in Customer</SelectItem>
                                        {members.map(member => (
                                            <SelectItem key={member.id} value={member.id}>{member.name} ({member.memberId})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {selectedMember === 'WALK-IN' && (
                                    <div className="mt-6 p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-4">
                                        <h4 className="text-sm font-bold text-slate-300">Walk-in Customer Details</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-500 uppercase font-bold">Name <span className="text-red-400">*</span></Label>
                                                <Input
                                                    value={walkInName} onChange={(e) => setWalkInName(e.target.value)}
                                                    placeholder="John Doe"
                                                    className="bg-slate-900 border-slate-700 text-white"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-500 uppercase font-bold">Phone Number <span className="text-red-400">*</span></Label>
                                                <Input
                                                    type="tel"
                                                    value={walkInPhone} onChange={(e) => setWalkInPhone(e.target.value)}
                                                    placeholder="9998887776"
                                                    className="bg-slate-900 border-slate-700 text-white"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-500 uppercase font-bold">Email Address</Label>
                                                <Input
                                                    value={walkInEmail} onChange={(e) => setWalkInEmail(e.target.value)}
                                                    placeholder="john@example.com" type="email"
                                                    className="bg-slate-900 border-slate-700 text-white"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-xs text-slate-500 uppercase font-bold">Address</Label>
                                                <Input
                                                    value={walkInAddress} onChange={(e) => setWalkInAddress(e.target.value)}
                                                    placeholder="123 Main St, City"
                                                    className="bg-slate-900 border-slate-700 text-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Items Section */}
                        <Card className="bg-slate-900 border-slate-800 shadow-2xl">
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-white">
                                        <ShoppingBag className="w-5 h-5 text-[#4FC3F7]" />
                                        Invoice Items
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">Add memberships, products or other items</CardDescription>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={addItem}
                                    className="border-[#4FC3F7] text-[#4FC3F7] hover:bg-[#4FC3F7] hover:text-slate-900 font-bold"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Add Item
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {items.map((item, index) => (
                                    <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50 group">
                                        <div className="col-span-12 md:col-span-5 space-y-1.5">
                                            <Label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Description</Label>
                                            <Input
                                                placeholder="e.g., Monthly Membership"
                                                value={item.description}
                                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                                className="bg-slate-900 border-slate-700 text-white h-11"
                                            />
                                        </div>
                                        <div className="col-span-4 md:col-span-2 space-y-1.5">
                                            <Label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Qty</Label>
                                            <Input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                className="bg-slate-900 border-slate-700 text-white h-11"
                                            />
                                        </div>
                                        <div className="col-span-5 md:col-span-3 space-y-1.5">
                                            <Label className="text-xs text-slate-500 uppercase font-bold tracking-wider">Unit Price</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                                <Input
                                                    type="number"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                    className="bg-slate-900 border-slate-700 text-white pl-8 h-11"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-3 md:col-span-2 flex justify-end">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeItem(index)}
                                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-11 w-11 rounded-xl"
                                                disabled={items.length === 1}
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-8">
                        <Card className="bg-slate-900 border-slate-800 shadow-2xl sticky top-24">
                            <CardHeader>
                                <CardTitle className="text-white">Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-slate-400 font-medium">
                                        <span>Subtotal</span>
                                        <span>₹{subtotal.toLocaleString()}</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs text-slate-500 uppercase font-bold">Discount (₹)</Label>
                                        <Input
                                            type="number"
                                            value={discount}
                                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                            className="bg-slate-950 border-slate-700 text-white h-10"
                                        />
                                    </div>
                                    <div className="flex justify-between text-slate-400 font-medium pt-1">
                                        <span>GST ({taxPercentage}%)</span>
                                        <span>₹{taxAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                                        <span className="text-lg font-bold text-white">Total Amount</span>
                                        <span className="text-2xl font-black text-[#4FC3F7]">₹{total.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-xs font-bold text-slate-500 uppercase">Payment Method</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            type="button"
                                            variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                                            className={paymentMethod === 'CASH' ? 'bg-[#4FC3F7] text-slate-900 hover:bg-[#4FC3F7]/90' : 'border-slate-700 hover:bg-slate-800 text-white'}
                                            onClick={() => setPaymentMethod('CASH')}
                                        >
                                            Cash
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={paymentMethod === 'UPI' ? 'default' : 'outline'}
                                            className={paymentMethod === 'UPI' ? 'bg-[#4FC3F7] text-slate-900 hover:bg-[#4FC3F7]/90' : 'border-slate-700 hover:bg-slate-800 text-white'}
                                            onClick={() => setPaymentMethod('UPI')}
                                        >
                                            UPI
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-[#4FC3F7] hover:bg-[#4FC3F7]/90 text-slate-900 font-bold h-12 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isSubmitting || !isValid}
                                    onClick={async () => {
                                        setIsSubmitting(true)
                                        try {
                                            const result = await createInvoice({
                                                memberId: selectedMember === 'WALK-IN' ? undefined : (selectedMember || undefined),
                                                walkInName: selectedMember === 'WALK-IN' ? walkInName.trim() || undefined : undefined,
                                                walkInPhone: selectedMember === 'WALK-IN' ? walkInPhone.trim() || undefined : undefined,
                                                walkInEmail: selectedMember === 'WALK-IN' ? walkInEmail.trim() || undefined : undefined,
                                                walkInAddress: selectedMember === 'WALK-IN' ? walkInAddress.trim() || undefined : undefined,
                                                paymentMethod,
                                                items,
                                                discount
                                            }) as { success: boolean, id?: string, error?: string }

                                            if (result?.error) {
                                                toast.error(result.error)
                                                return
                                            }

                                            if (result?.success && result.id) {
                                                setSuccess(true)
                                                toast.success("Invoice generated successfully")
                                                setTimeout(() => {
                                                    router.push(`/invoices/${result.id}`)
                                                }, 2000)
                                            }

                                        } catch {
                                            console.error("Error creating invoice")
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
