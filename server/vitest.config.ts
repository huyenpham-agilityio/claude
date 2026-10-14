import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // Test files share one SQLite database.
    fileParallelism: false,
    include: ['__tests__/**/*.test.ts'],
    globalSetup: ['__tests__/global-setup.ts'],
    env: { NODE_ENV: 'test', DATABASE_URL: 'file:./test.db' },
  },
})
