import { execSync } from 'node:child_process'
import { rmSync } from 'node:fs'

const TEST_DB = 'test.db'

// Start every run from a fresh database with all migrations applied.
export default function setup() {
  rmSync(TEST_DB, { force: true })
  execSync('pnpm exec prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: `file:./${TEST_DB}` },
    stdio: 'pipe',
  })
}
