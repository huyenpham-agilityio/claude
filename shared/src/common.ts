import { z } from 'zod'

export const transactionTypeSchema = z.enum(['expense', 'income'])
export type TransactionType = z.infer<typeof transactionTypeSchema>

// Money is a whole number of the currency's smallest unit (VND has no decimals).
export const amountSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER)

// Calendar month, e.g. "2026-10".
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected YYYY-MM')

export const apiErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
})
export type ApiError = z.infer<typeof apiErrorSchema>
