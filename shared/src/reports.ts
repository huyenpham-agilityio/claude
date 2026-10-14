import { z } from 'zod'
import { monthSchema } from './common.ts'
import { msg } from './validation.ts'

export const MAX_REPORT_MONTHS = 24

// An inclusive range of whole months, e.g. 2026-05 to 2026-10.
export const monthRangeSchema = z
  .object({ from: monthSchema, to: monthSchema })
  .refine(({ from, to }) => from <= to, { message: msg('rangeReversed'), path: ['from'] })
  .refine(({ from, to }) => monthsBetween(from, to) <= MAX_REPORT_MONTHS, {
    message: msg('rangeTooLong'),
    path: ['from'],
  })
export type MonthRange = z.infer<typeof monthRangeSchema>

// Counts both ends: 2026-01 to 2026-03 is 3 months.
export function monthsBetween(from: string, to: string): number {
  const [fromYear, fromMonth] = from.split('-').map(Number) as [number, number]
  const [toYear, toMonth] = to.split('-').map(Number) as [number, number]
  return (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1
}

export const reportSchema = z.object({
  from: monthSchema,
  to: monthSchema,
  // One entry per month in the range, oldest first, including empty months.
  months: z.array(
    z.object({ month: monthSchema, income: z.number().int(), expense: z.number().int() }),
  ),
  // Expense categories with spending in the range, largest first.
  spendingByCategory: z.array(
    z.object({
      category: z.object({ id: z.string(), name: z.string(), color: z.string() }),
      amount: z.number().int(),
    }),
  ),
})
export type Report = z.infer<typeof reportSchema>
