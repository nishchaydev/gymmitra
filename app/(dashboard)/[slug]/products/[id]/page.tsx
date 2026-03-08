"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const productFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    category: z.enum(['PROTEIN', 'SUPPLEMENT', 'MERCHANDISE', 'OTHER']),
    description: z.string().optional(),
    price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "Price must be a valid non-negative number",
    }),
    purchasePrice: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
        message: "Purchase price must be a valid non-negative number",
    }),
    stock: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
        message: "Stock must be a valid non-negative integer",
    }),
    lowStockAlert: z.string().optional().refine((val) => !val || (!isNaN(Number(val)) && Number(val) >= 0), {
        message: "Low stock alert must be a number",
    }),
})

type ProductFormValues = z.infer<typeof productFormSchema>

export default function EditProductPage() {
    const router = useRouter()
    const params = useParams()
    const slug = params?.slug as string || 'gym'
    const productId = params?.id as string

    const [loading, setLoading] = useState(false)
    const [initialLoading, setInitialLoading] = useState(true)

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: "",
            category: "SUPPLEMENT",
            description: "",
            price: "",
            purchasePrice: "",
            stock: "",
            lowStockAlert: "10"
        },
    })

    useEffect(() => {
        async function loadProduct() {
            try {
                const response = await fetch(`/api/products/${productId}`)
                if (!response.ok) {
                    if (response.status === 404) {
                        toast.error("Product not found")
                        router.push(`/${slug}/products`)
                        return
                    }
                    throw new Error("Failed to load product")
                }
                const product = await response.json()

                form.reset({
                    name: product.name,
                    category: product.category,
                    description: product.description || "",
                    price: product.price?.toString() || "",
                    purchasePrice: product.purchasePrice?.toString() || "",
                    stock: product.stock?.toString() || "",
                    lowStockAlert: product.lowStockAlert?.toString() || "10"
                })
            } catch (error) {
                console.error("Error loading product:", error)
                toast.error("Failed to load product details")
            } finally {
                setInitialLoading(false)
            }
        }

        if (productId) {
            loadProduct()
        }
    }, [productId, slug, router, form])

    async function onSubmit(data: ProductFormValues) {
        setLoading(true)
        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...data,
                    price: Number(data.price),
                    purchasePrice: data.purchasePrice ? Number(data.purchasePrice) : null,
                    stock: parseInt(data.stock),
                    lowStockAlert: data.lowStockAlert ? parseInt(data.lowStockAlert) : 10,
                }),
            })

            if (!response.ok) {
                throw new Error("Failed to update product")
            }

            toast.success("Product updated successfully")
            router.push(`/${slug}/products`)
            router.refresh()
        } catch (error) {
            toast.error("Something went wrong", {
                description: "Please try again.",
                duration: 3000,
            })
        } finally {
            setLoading(false)
        }
    }

    if (initialLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        )
    }

    return (
        <div className="container mx-auto py-10">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Edit Product</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Product Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Whey Protein Gold Standard" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select category" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="PROTEIN">Protein</SelectItem>
                                                    <SelectItem value="SUPPLEMENT">Supplement</SelectItem>
                                                    <SelectItem value="MERCHANDISE">Merchandise</SelectItem>
                                                    <SelectItem value="OTHER">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Selling Price (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="purchasePrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Owner Purchase Cost (₹)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                            </FormControl>
                                            <FormDescription>Used to calculate net profit correctly</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="stock"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Stock Count</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="lowStockAlert"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Low Stock Alert Level</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="10" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>


                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Product details..."
                                                className="resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push(`/${slug}/products`)}
                                    disabled={loading}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Product
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
