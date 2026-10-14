import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type Client, createClient } from '@libsql/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { applyMigrations, migrationNames } from '../src/migrate.ts'

const migrationsDir = fileURLToPath(new URL('../prisma/migrations', import.meta.url))

let dir: string
let client: Client

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'migrate-'))
  client = createClient({ url: `file:${join(dir, 'fresh.db')}` })
})

afterEach(() => {
  client.close()
  rmSync(dir, { recursive: true, force: true })
})

function writeMigration(root: string, name: string, sql: string) {
  mkdirSync(join(root, name), { recursive: true })
  writeFileSync(join(root, name, 'migration.sql'), sql)
}

async function tables() {
  const result = await client.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
  return result.rows.map((row) => String(row.name))
}

describe('applyMigrations', () => {
  it('builds the full schema on an empty database', async () => {
    const applied = await applyMigrations(client, migrationsDir)

    expect(applied).toEqual(migrationNames(migrationsDir))
    expect(await tables()).toEqual(
      expect.arrayContaining(['User', 'Session', 'Category', 'Transaction', 'Budget', 'SavingsGoal']),
    )
  })

  it('applies nothing the second time', async () => {
    await applyMigrations(client, migrationsDir)

    expect(await applyMigrations(client, migrationsDir)).toEqual([])
  })

  it('applies only new migrations, in name order', async () => {
    const own = join(dir, 'migrations')
    writeMigration(own, '002_second', 'CREATE TABLE "B" ("id" INTEGER);')
    writeMigration(own, '001_first', 'CREATE TABLE "A" ("id" INTEGER);')
    expect(await applyMigrations(client, own)).toEqual(['001_first', '002_second'])

    writeMigration(own, '003_third', 'CREATE TABLE "C" ("id" INTEGER);')

    expect(await applyMigrations(client, own)).toEqual(['003_third'])
    expect(await tables()).toEqual(expect.arrayContaining(['A', 'B', 'C']))
  })

  it('leaves a failing migration unapplied and unrecorded', async () => {
    const own = join(dir, 'migrations')
    writeMigration(own, '001_broken', 'CREATE TABLE "Half" ("id" INTEGER);\nNOT VALID SQL;')

    await expect(applyMigrations(client, own)).rejects.toThrow()

    expect(await tables()).not.toContain('Half')
    const recorded = await client.execute('SELECT name FROM _app_migrations')
    expect(recorded.rows).toHaveLength(0)
  })
})
