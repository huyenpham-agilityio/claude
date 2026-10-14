import { z } from 'zod'

const booleanFlag = z.enum(['true', 'false']).transform((value) => value === 'true')

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1).default('file:./dev.db'),
  // Required for a hosted Turso database, unused for a local file.
  DATABASE_AUTH_TOKEN: z.string().min(1).optional(),
  // Set to "false" once your account exists to stop anyone else signing up.
  REGISTRATION_OPEN: booleanFlag.default(true),
  // Set to "true" when running behind a reverse proxy (as on Railway).
  TRUST_PROXY: booleanFlag.default(false),
  // Directory of the built client to serve; leave unset in development,
  // where Vite serves it.
  CLIENT_DIST: z.string().min(1).optional(),
})

export const env = envSchema.parse(process.env)
