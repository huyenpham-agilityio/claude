import {
  type ApiError,
  type ApiErrorCode,
  MAX_REPORT_MONTHS,
  apiErrorMessages,
  fillPlaceholders,
  isValidationKey,
  validationMessages,
} from '@expenses/shared'
import type { ErrorRequestHandler, RequestHandler } from 'express'
import { ZodError } from 'zod'
import { HttpError } from '../errors.ts'

function errorBody(code: ApiErrorCode): ApiError {
  return { error: { code, message: apiErrorMessages[code] } }
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json(errorBody('notFound'))
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    // Schema messages are translation keys; send the key as the code and the
    // English text as the message.
    const issues = err.issues.map((issue) => {
      const path = issue.path.join('.')
      if (!isValidationKey(issue.message)) return { path, message: issue.message }
      const message = fillPlaceholders(validationMessages[issue.message], {
        max: MAX_REPORT_MONTHS,
      })
      return { path, code: issue.message, message }
    })
    const body = errorBody('invalidRequest')
    res.status(400).json({ error: { ...body.error, issues } } satisfies ApiError)
    return
  }

  if (err instanceof HttpError) {
    res.status(err.status).json(errorBody(err.code))
    return
  }

  // Express and its middleware raise client errors of their own, such as a
  // malformed JSON body (400) or a missing static file (404).
  if (isClientError(err)) {
    res.status(err.status).json(errorBody(err.status === 404 ? 'notFound' : 'invalidRequest'))
    return
  }

  console.error(err)
  res.status(500).json(errorBody('internalError'))
}

function isClientError(err: unknown): err is { status: number } {
  const status = (err as { status?: unknown } | null)?.status
  return typeof status === 'number' && status >= 400 && status < 500
}
