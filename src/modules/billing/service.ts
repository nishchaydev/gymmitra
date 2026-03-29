import { prisma } from "@/lib/prisma"
import { BillingRepository } from "./repository"
import { CreateInvoiceInput, RecordPaymentInput } from "./types"
import { calculateBillingTotal, resolveEffectiveTaxRate, distributeTaxAcrossItems } from "../shared/billing-calc"
import crypto from "crypto"

export class BillingService {
    /**
     * Create a new invoice with proper tax calculation and atomic generation of invoice number.
     * Optionally ties to a member or processes walk-in details.
     */
    static async createInvoice(
        gym: any,
        data: CreateInvoiceInput,
        userId: string,
        ip: string
    ): Promise<{ success: boolean; id?: string; error?: string }> {
        try {
            const invoiceResult = await prisma.$transaction(async (tx) => {
                const invoiceNumber = await BillingRepository.generateInvoiceNumber(gym.id, tx)
                
                // 1. Resolve tax percentage based on gym settings and item override
                const gymDefaultRate = gym.taxPercentage != null ? Number(gym.taxPercentage) : 18
                const effectiveTaxPercentage = resolveEffectiveTaxRate(
                    gym.taxEnabled !== false,
                    gymDefaultRate,
                    data.taxPercentage
                )

                // 2. Perform accurate billing math via shared domain calculator
                const calcResult = calculateBillingTotal(
                    data.items,
                    data.discount,
                    effectiveTaxPercentage
                )

                // 3. Optional priority for explicitly passed taxAmount (legacy compat / manual overrides)
                const finalTaxAmountCents = data.taxAmount != null
                    ? Math.round(data.taxAmount * 100)
                    : Math.round(calcResult.taxAmount * 100)
                
                const finalEffectiveTaxPercentage = calcResult.subtotalAfterDiscount > 0
                    ? (finalTaxAmountCents / (calcResult.subtotalAfterDiscount * 100)) * 100
                    : effectiveTaxPercentage
                
                const finalTotalCents = Math.round(calcResult.subtotalAfterDiscount * 100) + finalTaxAmountCents

                // 4. Spread tax properly among items to avoid floating point issues
                const distributedTaxList = distributeTaxAcrossItems(data.items, finalTaxAmountCents)

                // 5. Generate share token
                const shareToken = crypto.randomBytes(32).toString('hex')
                const expiryDays = gym.invoiceLinkExpiryDays ?? 30
                const shareTokenExpiresAt = expiryDays > 0
                    ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
                    : null

                // 6. DB Creation
                const invoice = await tx.invoice.create({
                    data: {
                        invoiceNumber,
                        type: "SALE",
                        gymId: gym.id,
                        memberId: data.memberId || null,
                        subtotal: calcResult.subtotal,
                        taxAmount: finalTaxAmountCents / 100,
                        taxPercentage: finalEffectiveTaxPercentage,
                        discount: data.discount,
                        total: finalTotalCents / 100,
                        idempotencyKey: data.idempotencyKey,
                        walkInName: data.walkInName ?? null,
                        walkInPhone: data.walkInPhone ?? null,
                        walkInEmail: data.walkInEmail ?? null,
                        walkInAddress: data.walkInAddress ?? null,
                        paymentMethod: data.paymentMethod,
                        paymentStatus: data.paymentStatus,
                        amountPaid: (data.paymentStatus === 'PARTIAL'
                            ? Math.min((data.amountPaid ?? 0), finalTotalCents / 100)
                            : data.paymentStatus === 'PENDING'
                                ? 0
                                : finalTotalCents / 100) as any,
                        balanceDue: (data.paymentStatus === 'PARTIAL'
                            ? Math.max(0, (finalTotalCents / 100) - Math.min((data.amountPaid ?? 0), finalTotalCents / 100))
                            : data.paymentStatus === 'PENDING'
                                ? finalTotalCents / 100
                                : 0) as any,
                        notes: data.notes ?? null,
                        shareToken,
                        shareTokenExpiresAt,
                        items: {
                            create: data.items.map((item, index) => {
                                const amount = Math.round(item.quantity * item.unitPrice * 100) / 100
                                const taxAmount = distributedTaxList[index] / 100

                                return {
                                    description: item.description,
                                    quantity: item.quantity,
                                    unitPrice: item.unitPrice,
                                    taxPercentage: finalEffectiveTaxPercentage,
                                    taxAmount,
                                    amount,
                                    gymId: gym.id
                                }
                            })
                        }
                    }
                })

                return invoice
            })

            return { success: true, id: invoiceResult.id }
        } catch (error: any) {
            console.error("Billing Service: createInvoice Error:", error)
            
            // Duplicate idempotency key check
            if (error?.code === 'P2002' && error.meta?.target?.includes('idempotencyKey') && data.idempotencyKey) {
                const existing = await BillingRepository.findByIdempotencyKey(data.idempotencyKey, gym.id)
                if (existing) return { success: true, id: existing.id }
            }
            
            return { success: false, error: error instanceof Error ? error.message : "Failed to create invoice" }
        }
    }

    /**
     * Record a partial or full payment on an existing invoice.
     */
    static async recordPayment(
        gymId: string,
        data: RecordPaymentInput
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const invoice = await BillingRepository.findInvoiceById(data.invoiceId, gymId)

            if (!invoice) return { success: false, error: "Invoice not found." }
            if (invoice.paymentStatus === 'PAID') return { success: false, error: "Invoice is already fully paid." }

            const total = Number(invoice.total)
            const currentPaid = Number(invoice.amountPaid || 0)
            let newPaid = currentPaid + data.additionalAmount

            if (newPaid > total) newPaid = total

            const newBalance = Math.max(0, total - newPaid)
            const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL'

            await BillingRepository.updatePaymentInfo(invoice.id, {
                amountPaid: Math.round(newPaid * 100) / 100,
                balanceDue: Math.round(newBalance * 100) / 100,
                paymentStatus: newStatus
            })

            return { success: true }
        } catch (error) {
            console.error("Billing Service: recordPayment Error:", error)
            return { success: false, error: "Failed to record payment." }
        }
    }
}
