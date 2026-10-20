import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Client } from '@libsql/client'

// Prisma Migrate cannot connect to Turso, so production applies the SQL files
// Prisma generates (prisma/migrations/<name>/migration.sql) itself. Each one
// runs once, in name order, recorded in its own table. Local databases keep
// using `prisma migrate dev`, which tracks migrations separately.
const TABLE = '_app_migrations'

export function migrationNames(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

// Returns the names of the migrations it applied.
export async function applyMigrations(client: Client, dir: string): Promise<string[]> {
  await client.execute(
    `CREATE TABLE IF NOT EXISTS ${TABLE} (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)`,
  )
  const done = new Set(
    (await client.execute(`SELECT name FROM ${TABLE}`)).rows.map((row) => String(row.name)),
  )

  const applied: string[] = []
  for (const name of migrationNames(dir)) {
    if (done.has(name)) continue
    const sql = readFileSync(join(dir, name, 'migration.sql'), 'utf8')
    // One transaction per migration: it either applies fully and is
    // recorded, or leaves the database as it was.
    try {
      await client.executeMultiple(
        `BEGIN;\n${sql}\n;INSERT INTO ${TABLE} (name, applied_at) VALUES ('${name.replaceAll("'", "''")}', datetime('now'));\nCOMMIT;`,
      )
    } catch (error) {
      // A failed statement leaves the transaction open; close it out.
      await client.execute('ROLLBACK').catch(() => {})
      throw new Error(`Migration ${name} failed`, { cause: error })
    }
    applied.push(name)
  }
  return applied
}
