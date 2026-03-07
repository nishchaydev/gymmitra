'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { generateInvoiceNumber } from "@/lib/invoice-server-utils"
import { z } from "zod"
import { withAuth } from "@/lib/with-auth"
import { recordAuditLog } from "@/lib/audit-logger"
import { headers } from 'next/headers'
import crypto from 'crypto'

const invoiceItemSchema = z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    type: z.enum(["MEMBERSHIP", "PRODUCT", "OTHER"]),
})

const createInvoiceSchema = z.object({
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
        // Note: Upper bound validation (total) is done inside the action directly since tax dynamically affects total
    }
})

// Secure Server Action wrapped in withAuth
export const createInvoice = withAuth(async (context, data: z.infer<typeof createInvoiceSchema>) => {
    // 1. Runtime Validation
    const validatedData = createInvoiceSchema.parse(data)

    // 2. Strict Tenant Context derived server-side
    const gym = context.gym

    const headerList = await headers()
    const ipHeader = headerList.get('x-forwarded-for')
    const ip = ipHeader ? ipHeader.split(',')[0].trim() : '127.0.0.1'

    try {
        const invoice = await prisma.$transaction(async (tx) => {
            const invoiceNumber = await generateInvoiceNumber(gym.id, tx)
            const taxPercentage = gym.taxPercentage != null ? Number(gym.taxPercentage) : 18

            // Use integer arithmetic (cents) for precision
            const subtotalCents = validatedData.items.reduce((acc, item) =>
                acc + Math.round(item.quantity * (item.unitPrice * 100)), 0)

            const discountCents = Math.round(validatedData.discount * 100)
            const subtotalAfterDiscountCents = Math.max(0, subtotalCents - discountCents)

            // Calculate Tax (Applied on the discounted subtotal)
            // taxAmount takes precedence over taxPercentage if explicitly provided by the caller
            const providedTaxPercentage = validatedData.taxPercentage ?? taxPercentage;
            const taxAmountCents = validatedData.taxAmount != null
                ? Math.round(validatedData.taxAmount * 100)
                : Math.round((subtotalAfterDiscountCents * providedTaxPercentage) / 100)
            // Derive effective percentage from actual amount so stored value stays consistent
            const effectiveTaxPercentage = subtotalAfterDiscountCents > 0
                ? (taxAmountCents / subtotalAfterDiscountCents) * 100
                : providedTaxPercentage
            const totalCents = subtotalAfterDiscountCents + taxAmountCents

            const shareToken = crypto.randomBytes(32).toString('hex')
            const expiryDays = gym.invoiceLinkExpiryDays ?? 30
            const shareTokenExpiresAt = expiryDays > 0
                ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
                : null // 0 = never expire

            let remainingTaxCents = taxAmountCents;
            let remainingSubtotalCents = subtotalCents;

            return await tx.invoice.create({
                data: {
                    invoiceNumber,
                    type: "SALE",
                    gym: { connect: { id: gym.id } },
                    member: validatedData.memberId ? { connect: { id: validatedData.memberId } } : undefined,
                    subtotal: subtotalCents / 100,
                    taxAmount: taxAmountCents / 100,
                    taxPercentage: effectiveTaxPercentage,
                    discount: validatedData.discount,
                    total: totalCents / 100,
                    idempotencyKey: validatedData.idempotencyKey,
                    walkInName: validatedData.walkInName ?? null,
                    walkInPhone: validatedData.walkInPhone ?? null,
                    walkInEmail: validatedData.walkInEmail ?? null,
                    walkInAddress: validatedData.walkInAddress ?? null,
                    paymentMethod: validatedData.paymentMethod,
                    paymentStatus: validatedData.paymentStatus,
                    amountPaid: (validatedData.paymentStatus === 'PARTIAL'
                        ? Math.min((validatedData.amountPaid ?? 0), totalCents / 100)
                        : validatedData.paymentStatus === 'PENDING'
                            ? 0
                            : totalCents / 100) as any,
                    balanceDue: (validatedData.paymentStatus === 'PARTIAL'
                        ? Math.max(0, (totalCents / 100) - Math.min((validatedData.amountPaid ?? 0), totalCents / 100))
                        : validatedData.paymentStatus === 'PENDING'
                            ? totalCents / 100
                            : 0) as any,
                    notes: validatedData.notes ?? null,
                    shareToken: shareToken,
                    shareTokenExpiresAt: shareTokenExpiresAt,
                    items: {
                        create: validatedData.items.map(item => {
                            const itemAmountCents = Math.round(item.quantity * (item.unitPrice * 100))

                            let itemTaxAmountCents = 0;
                            if (remainingSubtotalCents > 0) {
                                itemTaxAmountCents = Math.round(remainingTaxCents * (itemAmountCents / remainingSubtotalCents));
                                remainingTaxCents -= itemTaxAmountCents;
                                remainingSubtotalCents -= itemAmountCents;
                            }

                            return {
                                description: item.description,
                                quantity: item.quantity,
                                unitPrice: item.unitPrice,
                                taxPercentage: effectiveTaxPercentage,
                                taxAmount: itemTaxAmountCents / 100,
                                amount: itemAmountCents / 100,
                                gymId: gym.id
                            }
                        })
                    }
                }
            })
        })

        const gymSlug = (gym as { slug?: string }).slug || 'gym'
        revalidatePath(`/${gymSlug}/dashboard`)
        revalidatePath(`/${gymSlug}/invoices`)

        await recordAuditLog({
            gymId: gym.id,
            actorId: context.userId,
            action: 'CREATE_INVOICE',
            entityType: 'INVOICE',
            entityId: invoice.id,
            ipAddress: ip,
            payload: { invoiceNumber: invoice.invoiceNumber, total: invoice.total }
        }).catch(err => console.error('[Action] Audit logging failed silently:', err))

        return { success: true, id: invoice.id }
    } catch (error: unknown) {
        console.error("Invoice Action Error:", error)
        if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            const errorWithMeta = error as { meta?: { target?: string[] } };
            const target = errorWithMeta.meta?.target
            if (Array.isArray(target) && target.includes('idempotencyKey') && validatedData.idempotencyKey) {
                const existingInvoice = await prisma.invoice.findFirst({
                    where: {
                        idempotencyKey: validatedData.idempotencyKey,
                        gymId: gym.id
                    }
                })
                if (existingInvoice) return { success: true, id: existingInvoice.id }
            }
        }
        return { error: error instanceof Error ? error.message : "Failed to create invoice" }
    }
}, ['OWNER', 'STAFF']) // Only Owners and Staff can create invoices
