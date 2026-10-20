import { z } from 'zod'
import { amountSchema, dateSchema, monthSchema, transactionTypeSchema } from './common.ts'
import { msg } from './validation.ts'

export const TRANSACTION_PAGE_SIZE = 50

export const transactionSchema = z.object({
  id: z.string(),
  type: transactionTypeSchema,
  amount: z.number().int(),
  date: dateSchema,
  note: z.string().nullable(),
  category: z.object({ id: z.string(), name: z.string(), color: z.string() }),
})
export type Transaction = z.infer<typeof transactionSchema>

// The type is not part of the input: it always follows the chosen category.
export const transactionInputSchema = z.object({
  categoryId: z.string().min(1, msg('categoryRequired')),
  amount: amountSchema,
  date: dateSchema,
  note: z
    .string()
    .trim()
    .max(200, msg('noteTooLong'))
    .transform((value) => value || null)
    .nullable()
    .default(null),
})
export type TransactionInput = z.infer<typeof transactionInputSchema>

export const transactionListQuerySchema = z.object({
  month: monthSchema.optional(),
  type: transactionTypeSchema.optional(),
  categoryId: z.string().min(1).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
})
export type TransactionListQuery = z.infer<typeof transactionListQuerySchema>

export const transactionResponseSchema = z.object({ transaction: transactionSchema })

export const transactionListResponseSchema = z.object({
  transactions: z.array(transactionSchema),
  page: z.number().int(),
  pageCount: z.number().int(),
  total: z.number().int(),
  // Totals cover every match for the filters, not just the current page.
  totals: z.object({ income: z.number().int(), expense: z.number().int() }),
})
export type TransactionListResponse = z.infer<typeof transactionListResponseSchema>
