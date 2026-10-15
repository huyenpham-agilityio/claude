import { type ApiErrorCode, apiErrorMessages } from '@expenses/shared'

// The code is what the app translates; the message is its English text.
export class HttpError extends Error {
  readonly status: number
  readonly code: ApiErrorCode

  constructor(status: number, code: ApiErrorCode) {
    super(apiErrorMessages[code])
    this.status = status
    this.code = code
  }
}
