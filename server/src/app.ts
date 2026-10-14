import cookieParser from 'cookie-parser'
import express from 'express'
import { env } from './env.ts'
import { errorHandler, notFound } from './middleware/error.ts'
import { createAuthRouter } from './routes/auth.ts'
import { budgetsRouter } from './routes/budgets.ts'
import { categoriesRouter } from './routes/categories.ts'
import { goalsRouter } from './routes/goals.ts'
import { healthRouter } from './routes/health.ts'
import { reportsRouter } from './routes/reports.ts'
import { transactionsRouter } from './routes/transactions.ts'

export interface AppOptions {
  registrationOpen?: boolean
}

export function createApp({ registrationOpen = env.REGISTRATION_OPEN }: AppOptions = {}) {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json())
  app.use(cookieParser())

  app.use('/api/health', healthRouter)
  app.use('/api/auth', createAuthRouter({ registrationOpen }))
  app.use('/api/budgets', budgetsRouter)
  app.use('/api/categories', categoriesRouter)
  app.use('/api/goals', goalsRouter)
  app.use('/api/reports', reportsRouter)
  app.use('/api/transactions', transactionsRouter)

  app.use('/api', notFound)
  app.use(errorHandler)

  return app
}
