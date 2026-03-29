import { z } from "zod"
import { invoiceItemSchema, createInvoiceSchema, recordPaymentSchema } from "./validator"

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>
