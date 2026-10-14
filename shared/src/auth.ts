import { z } from 'zod'

const emailSchema = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'))

export const registerInputSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(200, 'Password must be at most 200 characters'),
})
export type RegisterInput = z.infer<typeof registerInputSchema>

export const loginInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password'),
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
