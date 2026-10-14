import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Test files share one SQLite database.
    fileParallelism: false,
    include: ['test/**/*.test.ts'],
    globalSetup: ['test/global-setup.ts'],
    env: { NODE_ENV: 'test', DATABASE_URL: 'file:./test.db' },
  },
})
