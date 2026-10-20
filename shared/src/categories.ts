import { z } from 'zod'
import { transactionTypeSchema } from './common.ts'
import { msg } from './validation.ts'

export const CATEGORY_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#0ea5e9',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#64748b',
] as const

const nameSchema = z
  .string()
  .trim()
  .min(1, msg('nameRequired'))
  .max(40, msg('categoryNameTooLong'))

const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, msg('colorRequired'))

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: transactionTypeSchema,
  color: z.string(),
  transactionCount: z.number().int().nonnegative(),
})
export type Category = z.infer<typeof categorySchema>

export const categoryCreateSchema = z.object({
  name: nameSchema,
  type: transactionTypeSchema,
  color: colorSchema,
})
export type CategoryCreate = z.infer<typeof categoryCreateSchema>

// A category's type is fixed once created, so its transactions stay consistent.
export const categoryUpdateSchema = z.object({
  name: nameSchema,
  color: colorSchema,
})
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>

export const categoryResponseSchema = z.object({ category: categorySchema })
export const categoryListResponseSchema = z.object({ categories: z.array(categorySchema) })
export type CategoryListResponse = z.infer<typeof categoryListResponseSchema>
