import { calculateBillingTotal, resolveEffectiveTaxRate, distributeTaxAcrossItems } from "../shared/billing-calc"
import crypto from "crypto"
import { Prisma } from "@prisma/client"
import { recordAuditLog } from "@/lib/audit-logger"
import { BillingRepository } from "./repository"
import { CreateInvoiceInput, RecordPaymentInput } from "./validator"

export class BillingService {
    /**
     * Create a new invoice with proper tax calculation and atomic generation of invoice number.
     * Optionally ties to a member or processes walk-in details.
     */
    static async createInvoice(
        gym: any,
        data: CreateInvoiceInput,
        userId: string,
        ip: string,
        existingTx?: Prisma.TransactionClient
    ): Promise<{ success: boolean; id?: string; error?: string }> {
        try {
            const executeInContext = async (tx: Prisma.TransactionClient) => {
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

                // 6. Compute payment amounts
                const finalTotal = finalTotalCents / 100
                const amountPaid = data.paymentStatus === 'PARTIAL'
                    ? Math.min((data.amountPaid ?? 0), finalTotal)
                    : data.paymentStatus === 'PENDING'
                        ? 0
                        : finalTotal
                const balanceDue = data.paymentStatus === 'PARTIAL'
                    ? Math.max(0, finalTotal - Math.min((data.amountPaid ?? 0), finalTotal))
                    : data.paymentStatus === 'PENDING'
                        ? finalTotal
                        : 0
                        
                // Auto-upgrade status if fully paid during creation
                const finalPaymentStatus = (data.paymentStatus === 'PARTIAL' && balanceDue <= 0.001) 
                    ? 'PAID' 
                    : data.paymentStatus

                // 7. DB Creation — via BillingRepository (no direct tx.invoice calls)
                const invoice = await BillingRepository.createInvoiceInTransaction({
                    invoiceNumber,
                    type: data.type || "SALE",
                    gymId: gym.id,
                    memberId: data.memberId || null,
                    subscriptionId: data.subscriptionId || null,
                    subtotal: calcResult.subtotal,
                    taxAmount: finalTaxAmountCents / 100,
                    taxPercentage: finalEffectiveTaxPercentage,
                    discount: data.discount,
                    total: finalTotal,
                    amountPaid,
                    balanceDue,
                    paymentStatus: finalPaymentStatus,
                    paymentMethod: data.paymentMethod,
                    idempotencyKey: data.idempotencyKey ?? null,
                    walkInName: data.walkInName ?? null,
                    walkInPhone: data.walkInPhone ?? null,
                    walkInEmail: data.walkInEmail ?? null,
                    walkInAddress: data.walkInAddress ?? null,
                    notes: data.notes ?? null,
                    shareToken,
                    shareTokenExpiresAt,
                    issueDate: data.issueDate || new Date(),
                    dueDate: data.dueDate || null,
                    items: data.items.map((item, index) => {
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
                }, tx)

                // 7.1 Deduct inventory stock for physical products
                for (const item of data.items) {
                    if (item.type === 'PRODUCT') {
                        // Priority 1: Match by productId if provided
                        // Priority 2: Match by exact name (fallback)
                        const matchedProduct = item.productId 
                            ? await tx.product.findFirst({ where: { id: item.productId, gymId: gym.id, isActive: true } })
                            : await tx.product.findFirst({ where: { gymId: gym.id, name: item.description, isActive: true } })
                        
                        if (matchedProduct) {
                            await tx.product.update({
                                where: { id: matchedProduct.id },
                                data: { stock: Math.max(0, matchedProduct.stock - item.quantity) }
                            })
                        }
                    }
                }

                // 7.2 Record Audit Log
                await recordAuditLog({
                    gymId: gym.id,
                    actorId: userId,
                    action: 'CREATE_INVOICE',
                    entityType: 'INVOICE',
                    entityId: invoice.id,
                    ipAddress: ip,
                    payload: {
                        invoiceNumber: invoice.invoiceNumber,
                        total: invoice.total,
                        type: invoice.type,
                        memberId: invoice.memberId,
                        itemsCount: invoice.items.length
                    }
                }, tx)

                return invoice
            }

            const invoiceResult = existingTx 
                ? await executeInContext(existingTx) 
                : await BillingRepository.executeTransaction(executeInContext)

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
            await BillingRepository.executeTransaction(async (tx) => {
                const invoice = await BillingRepository.findInvoiceById(data.invoiceId, gymId, tx)

                if (!invoice) throw new Error("Invoice not found.")
                if (invoice.paymentStatus === 'PAID') throw new Error("Invoice is already fully paid.")

                const total = Number(invoice.total)
                const currentPaid = Number(invoice.amountPaid || 0)
                const balanceRemaining = Math.max(0, total - currentPaid)

                // Reject overpayment — don't silently clamp
                if (data.additionalAmount > balanceRemaining) {
                    throw new Error(`Overpayment rejected: balance due is ₹${balanceRemaining.toFixed(2)}, but ₹${data.additionalAmount.toFixed(2)} was entered.`)
                }

                const newPaid = currentPaid + data.additionalAmount
                const newBalance = Math.max(0, total - newPaid)
                const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL'

                await BillingRepository.updatePaymentInfo(invoice.id, {
                    amountPaid: Math.round(newPaid * 100) / 100,
                    balanceDue: Math.round(newBalance * 100) / 100,
                    paymentStatus: newStatus
                }, tx)

                // Audit Log for payment Recording
                await recordAuditLog({
                    gymId,
                    actorId: "SYSTEM", // Ideally would be passed, but SYSTEM for batch/server-side actions
                    action: 'PROCESS_SALE',
                    entityType: 'INVOICE',
                    entityId: invoice.id,
                    payload: {
                        additionalAmount: data.additionalAmount,
                        newBalance,
                        newStatus
                    }
                }, tx)
            }, { isolationLevel: 'Serializable' as any })

            return { success: true }
        } catch (error: any) {
            console.error("Billing Service: recordPayment Error:", error)
            const msg = error?.message || "Failed to record payment."
            return { success: false, error: msg }
        }
    }
}
