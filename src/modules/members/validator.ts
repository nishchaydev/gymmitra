import { z } from 'zod'
import { safeParseDate } from '@/lib/utils'
import { nullableDateField, optionalDateField } from '@/lib/date-validation'

// ─── Base Member Schema (API-level) ─────────────────────────────────
// This is the SINGLE SOURCE OF TRUTH for member input validation.
// Frontend extends this. API validates against this. Service trusts validated data.

export const memberSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    email: z.string().email().optional().or(z.literal('')),
    dateOfBirth: nullableDateField('dateOfBirth'),
    pincode: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
    emergencyRelation: z.string().optional(),
    planId: z.string().optional().or(z.literal('none')),
    paymentMethod: z.enum(["CASH", "UPI", "CARD", "OTHER"]).optional(),
    customPrice: z.coerce.number().nonnegative().optional(),
    discount: z.coerce.number().nonnegative().optional().default(0),
    amountPaid: z.coerce.number().nonnegative().optional(),
    customEndDate: nullableDateField('customEndDate'),
    whatsappConsentGiven: z.boolean().optional().default(false),
    marketingConsentGiven: z.boolean().optional().default(false),
})

export const memberUpdateSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional(),
    email: z.string().email().optional().or(z.literal('')),
    dateOfBirth: optionalDateField('dateOfBirth'),
    status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED', 'PENDING']).optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    emergencyName: z.string().optional(),
    emergencyPhone: z.string().optional(),
    emergencyRelation: z.string().optional(),
    notes: z.string().optional(),
    whatsappConsentGiven: z.boolean().optional(),
    marketingConsentGiven: z.boolean().optional(),
})

// ─── Frontend Form Extension ────────────────────────────────────────
// Extends the base schema with form-specific rules (e.g., email required for welcome message).
// Used ONLY in MemberForm.tsx — never in API validation.

export const memberFormSchema = memberSchema.extend({
    email: z.string().email("Valid email is required to send the welcome message"),
    dateOfBirth: z.string().optional().refine((val) => !val || safeParseDate(val) !== null, {
        message: "Invalid date",
    }),
    customEndDate: z.string().optional().refine((val) => !val || safeParseDate(val) !== null, {
        message: "Invalid date",
    }),
})

// ─── Exported Types ─────────────────────────────────────────────────
export type MemberInput = z.infer<typeof memberSchema>
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>
export type MemberFormInput = z.infer<typeof memberFormSchema>
