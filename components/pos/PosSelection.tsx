'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    ShoppingBag,
    Plus,
    Minus,
    X,
    Search,
    CreditCard,
    Banknote,
    QrCode,
    User,
    ChevronRight,
    Loader2
} from 'lucide-react'
import { Product } from '@prisma/client'
import { toast } from 'sonner'
import { processPosSale } from '@/app/(dashboard)/[slug]/pos/actions'
import { useRouter } from 'next/navigation'

interface PosSelectionProps {
    slug: string
    products: any[]
    members: { id: string; name: string; phone: string }[]
}

export function PosSelection({ slug, products, members }: PosSelectionProps) {
    const router = useRouter()
    const [search, setSearch] = useState('')
    const [cart, setCart] = useState<{ product: any; quantity: number }[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'UPI' | 'CARD'>('CASH')
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
    const [memberSearch, setMemberSearch] = useState('')

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    )

    const filteredMembers = members.filter(m =>
        m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.phone.includes(memberSearch)
    ).slice(0, 5)

    const total = cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0)

    const addToCart = (product: any) => {
        if (product.stock <= 0) {
            toast.error('Product is out of stock')
            return
        }
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id)
            if (existing) {
                if (existing.quantity >= product.stock) {
                    toast.error(`Only ${product.stock} items available`)
                    return prev
                }
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { product, quantity: 1 }]
        })
    }

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product.id !== productId))
    }

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === productId) {
                const newQty = Math.max(1, Math.min(item.quantity + delta, item.product.stock))
                return { ...item, quantity: newQty }
            }
            return item
        }))
    }

    const handleCheckout = async () => {
        if (cart.length === 0) {
            toast.error('Cart is empty')
            return
        }

        setIsProcessing(true)
        try {
            const result = await processPosSale(slug, {
                items: cart.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    unitPrice: Number(item.product.price)
                })),
                paymentMethod,
                memberId: selectedMemberId || undefined
            })

            if (result.success) {
                toast.success('Sale processed successfully')
                setCart([])
                setSelectedMemberId(null)
                router.push(`/${slug}/invoices/${result.invoiceId}`)
            } else {
                toast.error(result.error || 'Failed to process sale')
            }
        } catch (error) {
            toast.error('An error occurred')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full overflow-hidden">
            {/* Products Selection */}
            <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
                <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-drift-200 shadow-sm">
                    <Search className="h-5 w-5 text-drift-400" />
                    <input
                        className="flex-1 outline-none text-slate-900 font-medium"
                        placeholder="Search protein, supplements, gym gear..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map((product) => (
                            <Card
                                key={product.id}
                                className="group relative overflow-hidden border-drift-200 hover:border-primary/50 transition-all cursor-pointer bg-white"
                                onClick={() => addToCart(product)}
                            >
                                <div className="p-4 space-y-3">
                                    <div className="aspect-square bg-slate-50 rounded-xl flex items-center justify-center border border-drift-100 group-hover:scale-95 transition-transform overflow-hidden">
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
                                        ) : (
                                            <ShoppingBag className="h-8 w-8 text-drift-300" />
                                        )}
                                    </div>
                                    <div className="space-y-1 text-center">
                                        <h3 className="font-black text-sm uppercase tracking-tight line-clamp-1">{product.name}</h3>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="text-primary font-black">₹{Number(product.price).toLocaleString()}</span>
                                            <span className="text-[10px] text-drift-400 font-bold bg-drift-50 px-1.5 py-0.5 rounded">
                                                {product.stock} IN STOCK
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform" />
                            </Card>
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                            <div className="p-4 bg-slate-50 rounded-3xl">
                                <ShoppingBag className="h-12 w-12 text-drift-200" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-drift-400 font-black uppercase tracking-widest text-sm">No products found</p>
                                <p className="text-drift-300 text-xs">Try searching for something else or add new inventory.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Cart & Checkout */}
            <div className="flex flex-col gap-4 h-full overflow-hidden">
                <Card className="flex-1 flex flex-col border-drift-200 bg-white shadow-xl overflow-hidden rounded-3xl">
                    <CardHeader className="bg-slate-900 text-white p-6 shrink-0">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg font-black uppercase tracking-widest">Order Summary</CardTitle>
                            <Badge variant="outline" className="bg-white/10 text-white border-white/20 h-6">
                                {cart.reduce((s, i) => s + i.quantity, 0)} ITEMS
                            </Badge>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col custom-scrollbar">
                        <div className="flex-1 space-y-4">
                            {cart.map((item) => (
                                <div key={item.product.id} className="flex items-start gap-3 group">
                                    <div className="h-12 w-12 rounded-lg bg-slate-50 border border-drift-100 flex items-center justify-center shrink-0">
                                        <ShoppingBag className="h-5 w-5 text-drift-300" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black uppercase tracking-tight truncate">{item.product.name}</p>
                                        <p className="text-xs text-primary font-bold">₹{Number(item.product.price).toLocaleString()} × {item.quantity}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 text-drift-400 hover:text-primary"
                                            onClick={() => updateQuantity(item.product.id, -1)}
                                        >
                                            <Minus className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 text-drift-400 hover:text-primary"
                                            onClick={() => updateQuantity(item.product.id, 1)}
                                        >
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 text-red-400 hover:text-red-600 ml-1"
                                            onClick={() => removeFromCart(item.product.id)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}

                            {cart.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-2 opacity-40">
                                    <ShoppingBag className="h-10 w-10 text-drift-300" />
                                    <p className="text-xs font-bold uppercase">Cart is empty</p>
                                </div>
                            )}
                        </div>

                        {/* Customer & Payment */}
                        <div className="mt-6 pt-6 border-t space-y-4 shrink-0">
                            {/* Member Selector */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-drift-400 uppercase tracking-widest">Customer</label>
                                {selectedMemberId ? (
                                    <div className="flex items-center justify-between bg-primary/5 border border-primary/20 p-3 rounded-2xl">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="text-xs font-bold">
                                                <p>{members.find(m => m.id === selectedMemberId)?.name}</p>
                                                <p className="text-drift-400 font-medium tracking-tight">
                                                    {members.find(m => m.id === selectedMemberId)?.phone}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => setSelectedMemberId(null)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2 relative">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-drift-300" />
                                            <Input
                                                placeholder="Search members..."
                                                className="pl-9 h-9 text-xs rounded-xl"
                                                value={memberSearch}
                                                onChange={(e) => setMemberSearch(e.target.value)}
                                            />
                                        </div>
                                        {memberSearch && (
                                            <div className="bg-white border rounded-xl overflow-hidden shadow-lg absolute z-20 w-[calc(100%-48px)]">
                                                {filteredMembers.map(m => (
                                                    <button
                                                        key={m.id}
                                                        className="w-full text-left p-2.5 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                                                        onClick={() => {
                                                            setSelectedMemberId(m.id)
                                                            setMemberSearch('')
                                                        }}
                                                    >
                                                        <div>
                                                            <p className="font-bold">{m.name}</p>
                                                            <p className="text-drift-400 tracking-tight">{m.phone}</p>
                                                        </div>
                                                        <ChevronRight className="h-3 w-3 text-drift-300" />
                                                    </button>
                                                ))}
                                                <button
                                                    className="w-full text-center p-2 text-[10px] font-black text-primary uppercase bg-slate-50"
                                                    onClick={() => {
                                                        setSelectedMemberId(null)
                                                        setMemberSearch('')
                                                    }}
                                                >
                                                    Check out as Walk-in
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-drift-400 uppercase tracking-widest">Payment Method</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['CASH', 'UPI', 'CARD'] as const).map((method) => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentMethod(method)}
                                            className={`
                                                flex flex-col items-center justify-center p-2 rounded-2xl border-2 transition-all gap-1
                                                ${paymentMethod === method
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-drift-50 hover:border-drift-100 text-drift-400'
                                                }
                                            `}
                                        >
                                            {method === 'CASH' && <Banknote className="h-4 w-4" />}
                                            {method === 'UPI' && <QrCode className="h-4 w-4" />}
                                            {method === 'CARD' && <CreditCard className="h-4 w-4" />}
                                            <span className="text-[10px] font-black">{method}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Grand Total */}
                        <div className="mt-auto space-y-4 pt-4 shrink-0">
                            <div className="bg-slate-50 p-4 rounded-2xl space-y-1">
                                <div className="flex items-center justify-between text-xs font-medium text-drift-400">
                                    <span>Subtotal</span>
                                    <span>₹{total.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center justify-between text-2xl font-black text-slate-900">
                                    <span>Total</span>
                                    <span>₹{total.toLocaleString()}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-widest gap-2"
                                disabled={cart.length === 0 || isProcessing}
                                onClick={handleCheckout}
                            >
                                {isProcessing ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>Complete Checkout <ChevronRight className="h-5 w-5" /></>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
