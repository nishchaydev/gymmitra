import { z } from "zod"

export const invoiceItemSchema = z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    type: z.enum(["MEMBERSHIP", "PRODUCT", "OTHER"]),
})

export const createInvoiceSchema = z.object({
    memberId: z.string().optional(),
    // Walk-in fields: only relevant when no memberId is provided
    walkInName: z.string().optional(),
    walkInPhone: z.string().regex(/^[+\d][\d\s\-().]{6,19}$/, "Invalid phone number").optional(),
    walkInEmail: z.string().email("Invalid email").optional().or(z.literal('')),
    walkInAddress: z.string().optional(),
    paymentMethod: z.enum(["CASH", "UPI"]),
    paymentStatus: z.enum(["PAID", "PARTIAL", "PENDING"]).default("PAID"),
    amountPaid: z.number().min(0).optional(),
    notes: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1),
    discount: z.number().min(0).default(0),
    taxPercentage: z.number().min(0).max(100).optional(),
    taxAmount: z.number().min(0).optional(),
    idempotencyKey: z.string().optional(),
}).refine(data => data.memberId || data.walkInName, {
    message: "Customer identification is required (Member or Walk-in Name)",
    path: ["walkInName"]
}).superRefine((data, ctx) => {
    if (data.paymentStatus === 'PARTIAL') {
        if (data.amountPaid === undefined || data.amountPaid <= 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Amount paid must be greater than 0 for partial payments",
                path: ["amountPaid"]
            });
        }
        // Note: Upper bound validation (total) is done inside the service layer since tax dynamically affects total
    }
})

export const recordPaymentSchema = z.object({
    invoiceId: z.string(),
    additionalAmount: z.number().min(0.01),
})
