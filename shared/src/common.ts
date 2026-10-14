import { z } from 'zod'

export const transactionTypeSchema = z.enum(['expense', 'income'])
export type TransactionType = z.infer<typeof transactionTypeSchema>

export const MAX_AMOUNT = 1_000_000_000_000

// Money is a whole number of the currency's smallest unit (VND has no decimals).
export const amountSchema = z
  .number('Enter an amount')
  .int('Enter a whole amount')
  .positive('Amount must be greater than zero')
  .max(MAX_AMOUNT, 'Amount is too large')

// Calendar month, e.g. "2026-10".
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected YYYY-MM')

// Calendar date, e.g. "2026-10-14". Rejects dates that do not exist.
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a date')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
  }, 'Enter a real date')

export const apiErrorSchema = z.object({
  error: z.object({
    message: z.string(),
    issues: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
})
export type ApiError = z.infer<typeof apiErrorSchema>
