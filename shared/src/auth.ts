import { z } from 'zod'
import { msg } from './validation.ts'

const emailSchema = z.string().trim().toLowerCase().pipe(z.email(msg('emailInvalid')))

export const LOCALES = ['en', 'vi'] as const
export const localeSchema = z.enum(LOCALES)
export type Locale = z.infer<typeof localeSchema>

// What the sign-up form validates.
export const credentialsSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, msg('passwordTooShort')).max(200, msg('passwordTooLong')),
})

// The account's language picks the names of its default categories. It is
// optional on the wire so older clients still sign up in English.
export const registerInputSchema = credentialsSchema.extend({
  locale: localeSchema.default('en'),
})
export type RegisterInput = z.infer<typeof registerInputSchema>

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, msg('passwordRequired')),
})
export type LoginInput = z.infer<typeof loginInputSchema>

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  currency: z.string(),
})
export type User = z.infer<typeof userSchema>

export const authResponseSchema = z.object({ user: userSchema })
export type AuthResponse = z.infer<typeof authResponseSchema>

export const okResponseSchema = z.object({ ok: z.literal(true) })
export type OkResponse = z.infer<typeof okResponseSchema>
