import cookieParser from 'cookie-parser'
import express from 'express'
import { errorHandler, notFound } from './middleware/error.ts'
import { healthRouter } from './routes/health.ts'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  app.use(express.json())
  app.use(cookieParser())

  app.use('/api/health', healthRouter)

  app.use('/api', notFound)
  app.use(errorHandler)

  return app
}
