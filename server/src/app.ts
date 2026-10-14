import cookieParser from 'cookie-parser'
import express from 'express'
import { env } from './env.ts'
import { errorHandler, notFound } from './middleware/error.ts'
import { createAuthRouter } from './routes/auth.ts'
import { healthRouter } from './routes/health.ts'

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

  app.use('/api', notFound)
  app.use(errorHandler)

  return app
}
