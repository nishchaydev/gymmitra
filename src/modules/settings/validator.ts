import { z } from 'zod'

const RESERVED_SLUGS = ['api', 'admin', 'settings', 'auth', 'login', 'register', 'dashboard', 'profile', 'root', 'static', 'public', 'gymmitra', 'official']

export const settingsSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    address: z.string().optional(),
    gst: z.string().optional(),
    invoicePrefix: z.string().min(1).max(5).optional(),
    invoiceLinkExpiryDays: z.number().int().min(0).max(365).optional(), // 0 = never expire
    termsAndConditions: z.string().max(1000).optional(),
    waWelcomeMsg: z.string().max(2000).optional().nullable(),
    waInvoiceMsg: z.string().max(2000).optional().nullable(),
    waRenewalMsg: z.string().max(2000).optional().nullable(),
    waOverdueMsg: z.string().max(2000).optional().nullable(),
    dobMandatory: z.boolean().optional(),
    taxEnabled: z.boolean().optional(),
    taxPercentage: z.number().min(0).max(100).optional(),
    slug: z.string()
        .min(2, "Slug must be at least 2 characters")
        .max(100, "Slug must be less than 100 characters")
        .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")
        .refine(val => !RESERVED_SLUGS.includes(val.toLowerCase()), {
            message: "This slug is reserved and cannot be used"
        })
        .optional(),
})

export type SettingsInput = z.infer<typeof settingsSchema>
