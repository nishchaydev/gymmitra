import { z } from 'zod'
import { PaymentStatus as PrismaPaymentStatus } from '@prisma/client'

// ─── Subscription Schema ────────────────────────────────────────────
// Extracted from app/api/memberships/subscriptions/route.ts
// This is the SINGLE SOURCE OF TRUTH for subscription input validation.

export const subscriptionSchema = z.object({
    memberId: z.string().min(1, "Member ID is required"),
    planId: z.string().min(1, "Plan ID is required"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/, "ISO 8601 format required")
        .transform((str) => new Date(str))
        .refine((date) => !isNaN(date.getTime()), { message: "Invalid date" }),
    price: z.coerce.number().min(0, "Price cannot be negative").optional(),
    paymentStatus: z.nativeEnum(PrismaPaymentStatus).default(PrismaPaymentStatus.PAID),
    discountReason: z.string().optional(),
    force: z.boolean().optional().default(false),
})

// ─── Exported Types ─────────────────────────────────────────────────
export type SubscriptionInput = z.infer<typeof subscriptionSchema>
