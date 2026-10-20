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
import { clientRouter } from './static.ts'

export interface AppOptions {
  registrationOpen?: boolean
  // Built client to serve alongside the API, if any.
  clientDist?: string
}

export function createApp({
  registrationOpen = env.REGISTRATION_OPEN,
  clientDist = env.CLIENT_DIST,
}: AppOptions = {}) {
  const app = express()

  app.disable('x-powered-by')
  // Behind a hosting proxy, trust its X-Forwarded-For so rate limits see the
  // visitor's IP instead of the proxy's.
  if (env.TRUST_PROXY) app.set('trust proxy', 1)
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

  const client = clientDist ? clientRouter(clientDist) : null
  if (client) app.use(client)

  app.use(errorHandler)

  return app
}
