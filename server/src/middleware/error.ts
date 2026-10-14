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

  // Express and its middleware raise client errors of their own, such as a
  // malformed JSON body (400) or a missing static file (404).
  if (isClientError(err)) {
    const message = err.status === 404 ? 'Not found' : 'Invalid request'
    res.status(err.status).json({ error: { message } } satisfies ApiError)
    return
  }

  console.error(err)
  res.status(500).json({ error: { message: 'Internal server error' } } satisfies ApiError)
}

function isClientError(err: unknown): err is { status: number } {
  const status = (err as { status?: unknown } | null)?.status
  return typeof status === 'number' && status >= 400 && status < 500
}
