/**
 * Shared Schemas — Single Import Point
 * 
 * Re-exports ALL Zod schemas and their inferred types from each module.
 * Import from here instead of reaching into individual module validators.
 * 
 * RULES:
 *   1. No inline validation anywhere — use these schemas
 *   2. Frontend → matches schema
 *   3. API → validates schema
 *   4. Service → trusts validated data
 */

// Members
export {
  memberSchema,
  memberUpdateSchema,
  memberFormSchema,
  type MemberInput,
  type MemberUpdateInput,
  type MemberFormInput,
} from '../members/validator'

// Billing
export {
  createInvoiceSchema,
  recordPaymentSchema,
  invoiceItemSchema,
  type CreateInvoiceInput,
  type RecordPaymentInput,
  type InvoiceItemInput,
} from '../billing/validator'

// Attendance
export {
  checkInSchema,
  type CheckInInput,
} from '../attendance/validator'

// Settings
export {
  settingsSchema,
  type SettingsInput,
} from '../settings/validator'

// Products
export {
  productSchema,
  productUpdateSchema,
  type CreateProductInput,
  type UpdateProductInput,
} from '../products/validator'

// Memberships
export {
  subscriptionSchema,
  type SubscriptionInput,
} from '../memberships/validator'
