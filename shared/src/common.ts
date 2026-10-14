import { z } from 'zod'
import { msg } from './validation.ts'

export const transactionTypeSchema = z.enum(['expense', 'income'])
export type TransactionType = z.infer<typeof transactionTypeSchema>

export const MAX_AMOUNT = 1_000_000_000_000

// Money is a whole number of the currency's smallest unit (VND has no decimals).
export const amountSchema = z
  .number(msg('amountRequired'))
  .int(msg('amountWhole'))
  .positive(msg('amountPositive'))
  .max(MAX_AMOUNT, msg('amountTooLarge'))

// Calendar month, e.g. "2026-10".
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, msg('monthInvalid'))

// Calendar date, e.g. "2026-10-14". Rejects dates that do not exist.
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, msg('dateRequired'))
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`)
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
  }, msg('dateInvalid'))

// Errors carry a stable code the app translates, plus English text for
// anyone reading the response directly.
export const apiErrorMessages = {
  notSignedIn: 'Not signed in',
  registrationClosed: 'Registration is closed',
  emailTaken: 'An account with this email already exists',
  invalidCredentials: 'Incorrect email or password',
  tooManyAttempts: 'Too many attempts. Try again in a few minutes.',
  unknownCategory: 'Choose one of your categories',
  categoryNotFound: 'Category not found',
  categoryNameTaken: 'You already have a category with this name',
  categoryInUse: 'This category still has transactions. Move or delete them first.',
  budgetExpenseOnly: 'Budgets can only be set for expense categories',
  noBudgetsToCopy: 'There are no budgets to copy from that month',
  budgetNotFound: 'Budget not found',
  goalNotFound: 'Savings goal not found',
  withdrawTooMuch: 'You cannot take out more than has been saved',
  transactionNotFound: 'Transaction not found',
  notFound: 'Not found',
  invalidRequest: 'Invalid request',
  internalError: 'Internal server error',
} as const

export type ApiErrorCode = keyof typeof apiErrorMessages

export const apiErrorSchema = z.object({
  error: z.object({
    // Optional and open-ended, so a client keeps working when a newer server
    // adds codes it doesn't know yet.
    code: z.string().optional(),
    message: z.string(),
    issues: z
      .array(z.object({ path: z.string(), code: z.string().optional(), message: z.string() }))
      .optional(),
  }),
})
export type ApiError = z.infer<typeof apiErrorSchema>
