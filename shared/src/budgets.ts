import { z } from 'zod'
import { amountSchema, monthSchema } from './common.ts'
import { msg } from './validation.ts'

// A budget is "close" once this share of its limit is spent.
export const BUDGET_WARNING_RATIO = 0.8

export type BudgetStatus = 'ok' | 'warning' | 'over'

// Spending exactly the limit is a warning; only going past it is over.
export function budgetStatus(spent: number, limit: number): BudgetStatus {
  if (spent > limit) return 'over'
  if (spent >= limit * BUDGET_WARNING_RATIO) return 'warning'
  return 'ok'
}

export const budgetSchema = z.object({
  id: z.string(),
  month: monthSchema,
  limitAmount: z.number().int(),
  // Total of the category's expenses in this month.
  spent: z.number().int(),
  category: z.object({ id: z.string(), name: z.string(), color: z.string() }),
})
export type Budget = z.infer<typeof budgetSchema>

// Saving a budget for a category and month that already has one replaces it.
export const budgetInputSchema = z.object({
  categoryId: z.string().min(1, msg('categoryRequired')),
  month: monthSchema,
  limitAmount: amountSchema,
})
export type BudgetInput = z.infer<typeof budgetInputSchema>

export const budgetCopySchema = z.object({ from: monthSchema, to: monthSchema })
export type BudgetCopy = z.infer<typeof budgetCopySchema>

export const budgetListQuerySchema = z.object({ month: monthSchema })

export const budgetResponseSchema = z.object({ budget: budgetSchema })

export const budgetListResponseSchema = z.object({
  month: monthSchema,
  budgets: z.array(budgetSchema),
  // When this month has no budgets: the latest earlier month that does.
  copyFrom: monthSchema.nullable(),
})
export type BudgetListResponse = z.infer<typeof budgetListResponseSchema>
