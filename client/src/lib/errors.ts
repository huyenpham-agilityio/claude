import {
  type ApiErrorCode,
  MAX_REPORT_MONTHS,
  apiErrorMessages,
  isValidationKey,
} from '@expenses/shared'
import { useTranslation } from 'react-i18next'
import { ApiRequestError } from './api.ts'

function isApiErrorCode(code: string | undefined): code is ApiErrorCode {
  return code !== undefined && Object.hasOwn(apiErrorMessages, code)
}

// Turns a failed request into text in the current language. Unknown codes
// fall back to the server's own message; anything that isn't an API error
// (network down, unexpected response) gets a general message.
export function useErrorText() {
  const { t } = useTranslation()
  function errorText(error: Error): string
  function errorText(error: Error | null): string | null
  function errorText(error: Error | null): string | null {
    if (!error) return null
    if (!(error instanceof ApiRequestError)) return t('apiErrors.unexpected')
    if (isApiErrorCode(error.code)) return t(`apiErrors.${error.code}`)
    if (error.code === 'requestFailed') return t('apiErrors.requestFailed', { status: error.status })
    return error.message
  }
  return errorText
}

// Validation messages are keys (see shared/src/validation.ts), translated
// when shown so a visible error follows a language switch.
export function useValidationText() {
  const { t } = useTranslation()
  return (message: string | undefined, values?: Record<string, string>): string | undefined => {
    if (!message || !isValidationKey(message)) return message
    return t(`validation.${message}`, { max: MAX_REPORT_MONTHS, amount: '', ...values })
  }
}
