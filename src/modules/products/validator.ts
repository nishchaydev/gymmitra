import { z } from 'zod'

export const productSchema = z.object({
    name: z.string().min(2),
    category: z.enum(['PROTEIN', 'SUPPLEMENT', 'MERCHANDISE', 'OTHER']),
    description: z.string().optional(),
    price: z.coerce.number().min(0),
    purchasePrice: z.coerce.number().min(0).optional().nullable(),
    stock: z.coerce.number().int().min(0),
    lowStockAlert: z.coerce.number().int().min(0).default(10),
    image: z.string().optional(),
    gymId: z.string().min(1).optional(), // Optional since we get it from auth
})

export const productUpdateSchema = productSchema.partial()

export type CreateProductInput = z.infer<typeof productSchema>
export type UpdateProductInput = z.infer<typeof productUpdateSchema>
