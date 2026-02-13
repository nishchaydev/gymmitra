'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ReceiptText, User, ShoppingBag, CreditCard } from 'lucide-react'
import { createInvoice } from '../actions'

export default function NewInvoiceForm({ members, products }: { members: any[], products: any[] }) {
    const [selectedMember, setSelectedMember] = useState<string>('')
    const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0, type: 'OTHER' }])
    const [discount, setDiscount] = useState(0)
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI'>('CASH')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0, type: 'OTHER' }])
    const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index))
    const updateItem = (index: number, field: string, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0)
    const total = Math.max(0, subtotal - discount)

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ReceiptText className="w-5 h-5 text-primary" />
                            Invoice Items
                        </CardTitle>
                        <CardDescription>Add memberships or products to this invoice.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select Member</Label>
                            <Select onValueChange={setSelectedMember}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a member..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map(member => (
                                        <SelectItem key={member.id} value={member.id}>
                                            {member.name} ({member.phone})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-4 pt-4">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-end border-b pb-4">
                                    <div className="flex-1 space-y-2">
                                        <Label>Description</Label>
                                        <Input
                                            value={item.description}
                                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                            placeholder="e.g. Monthly Membership"
                                        />
                                    </div>
                                    <div className="w-24 space-y-2">
                                        <Label>Qty</Label>
                                        <Input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="w-32 space-y-2">
                                        <Label>Price (₹)</Label>
                                        <Input
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => removeItem(idx)}
                                        disabled={items.length === 1}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" size="sm" onClick={addItem} className="w-full dashed">
                                <Plus className="w-4 h-4 mr-2" /> Add Item
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card className="bg-slate-900 text-white">
                    <CardHeader>
                        <CardTitle>Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-slate-400">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Discount</span>
                                <div className="w-24">
                                    <Input
                                        type="number"
                                        value={discount}
                                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                        className="bg-slate-800 border-slate-700 text-right h-8 text-xs"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-between text-xl font-bold pt-4 border-t border-slate-800">
                                <span>Total</span>
                                <span className="text-primary">₹{total.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-800">
                            <Label className="text-slate-400">Payment Method</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                                    className={paymentMethod === 'CASH' ? 'bg-primary' : 'border-slate-700 hover:bg-slate-800'}
                                    onClick={() => setPaymentMethod('CASH')}
                                >
                                    Cash
                                </Button>
                                <Button
                                    variant={paymentMethod === 'UPI' ? 'default' : 'outline'}
                                    className={paymentMethod === 'UPI' ? 'bg-primary' : 'border-slate-700 hover:bg-slate-800'}
                                    onClick={() => setPaymentMethod('UPI')}
                                >
                                    UPI
                                </Button>
                            </div>
                        </div>

                        <Button
                            className="w-full bg-primary hover:bg-primary-600 font-bold"
                            disabled={isSubmitting || total <= 0}
                            onClick={async () => {
                                setIsSubmitting(true)
                                try {
                                    await createInvoice({
                                        memberId: selectedMember || undefined,
                                        paymentMethod,
                                        items,
                                        discount
                                    })
                                } catch (error) {
                                    console.error(error)
                                    alert("Error creating invoice")
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
    )
}
