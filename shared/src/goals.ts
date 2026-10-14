import { z } from 'zod'
import { MAX_AMOUNT, amountSchema, dateSchema } from './common.ts'

export const goalSchema = z.object({
  id: z.string(),
  name: z.string(),
  targetAmount: z.number().int(),
  savedAmount: z.number().int(),
  targetDate: dateSchema.nullable(),
})
export type Goal = z.infer<typeof goalSchema>

export const goalInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Enter a name')
    .max(60, 'Name must be at most 60 characters'),
  targetAmount: amountSchema,
  targetDate: dateSchema.nullable(),
})
export type GoalInput = z.infer<typeof goalInputSchema>

// Positive to add money to a goal, negative to take it out.
export const goalContributionSchema = z.object({
  amount: z
    .number('Enter an amount')
    .int('Enter a whole amount')
    .refine((amount) => amount !== 0, 'Amount must not be zero')
    .refine((amount) => Math.abs(amount) <= MAX_AMOUNT, 'Amount is too large'),
})
export type GoalContribution = z.infer<typeof goalContributionSchema>

export const goalResponseSchema = z.object({ goal: goalSchema })
export const goalListResponseSchema = z.object({ goals: z.array(goalSchema) })
export type GoalListResponse = z.infer<typeof goalListResponseSchema>
