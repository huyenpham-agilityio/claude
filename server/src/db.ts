import { PrismaLibSql } from '@prisma/adapter-libsql'
import { env } from './env.ts'
import { PrismaClient } from './generated/prisma/client.ts'

// libSQL reads both a local SQLite file ("file:./dev.db") and a hosted Turso
// database ("libsql://...", which needs an auth token).
const adapter = new PrismaLibSql({ url: env.DATABASE_URL, authToken: env.DATABASE_AUTH_TOKEN })

export const prisma = new PrismaClient({ adapter })
