import { fileURLToPath } from 'node:url'
import { createClient } from '@libsql/client'
import { env } from '../src/env.ts'
import { applyMigrations } from '../src/migrate.ts'

const dir = fileURLToPath(new URL('../prisma/migrations', import.meta.url))
const client = createClient({ url: env.DATABASE_URL, authToken: env.DATABASE_AUTH_TOKEN })

try {
  const applied = await applyMigrations(client, dir)
  console.log(applied.length ? `Applied migrations: ${applied.join(', ')}` : 'Database is up to date')
} finally {
  client.close()
}
