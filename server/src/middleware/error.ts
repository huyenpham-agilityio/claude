import type { ApiError } from '@expenses/shared'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { HttpError } from '../errors.ts'

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { message: 'Not found' } } satisfies ApiError)
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const issues = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    res.status(400).json({ error: { message: 'Invalid request', issues } } satisfies ApiError)
    return
  }

  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message } } satisfies ApiError)
    return
  }

  console.error(err)
  res.status(500).json({ error: { message: 'Internal server error' } } satisfies ApiError)
}
