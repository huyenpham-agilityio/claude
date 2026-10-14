import { z } from 'zod'

const booleanFlag = z.enum(['true', 'false']).transform((value) => value === 'true')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1).default('file:./dev.db'),
  // Set to "false" once your account exists to stop anyone else signing up.
  REGISTRATION_OPEN: booleanFlag.default(true),
})

export const env = envSchema.parse(process.env)
