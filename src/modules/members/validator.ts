import { z } from 'zod'

export const memberSchema = z.object({
     name: z.string().min(2, "Name must be at least 2 characters"),
     phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
     email: z.string().email().optional().or(z.literal('')),
      dateOfBirth: z.union([z.string(), z.null()]).optional().nullable()
          .transform(str => str && str !== '' && !isNaN(Date.parse(str)) ? new Date(str) : null),
     pincode: z.string().optional(),
     state: z.string().optional(),
     city: z.string().optional(),
     emergencyName: z.string().optional(),
     emergencyPhone: z.string().optional(),
     emergencyRelation: z.string().optional(),
     planId: z.string().optional().or(z.literal('none')),
     paymentMethod: z.enum(["CASH", "UPI", "CARD", "OTHER"]).optional(),
     customPrice: z.number().nonnegative().optional(),
     discount: z.number().nonnegative().optional().default(0),
     amountPaid: z.number().nonnegative().optional(),
     customEndDate: z.union([z.string(), z.null()]).optional().nullable()
         .transform(str => str && str !== '' && !isNaN(Date.parse(str)) ? new Date(str) : null),
 })

export const memberUpdateSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional(),
    email: z.string().email().optional().or(z.literal('')),
    dateOfBirth: z.string().transform(str => new Date(str)).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'PENDING']).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
    emergencyRelation: z.string().optional(),
    notes: z.string().optional(),
})
