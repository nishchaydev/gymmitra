import { z } from 'zod'

export const staffSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address").toLowerCase(),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional(),
    role: z.enum(['STAFF', 'TRAINER', 'MANAGER', 'FRONT_DESK']),
})

export type CreateStaffInput = z.infer<typeof staffSchema>
