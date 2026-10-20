import { apiErrorSchema } from '@expenses/shared'
import type { z } from 'zod'

export class ApiRequestError extends Error {
  readonly status: number
  // The server's error code, for translating the message.
  readonly code: string | undefined

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

// Calls the API and validates the response body against the shared schema.
export async function apiFetch<T extends z.ZodType>(
  path: string,
  schema: T,
  init?: RequestInit,
): Promise<z.infer<T>> {
  const res = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const body: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const parsed = apiErrorSchema.safeParse(body)
    if (parsed.success) {
      throw new ApiRequestError(res.status, parsed.data.error.message, parsed.data.error.code)
    }
    throw new ApiRequestError(res.status, `Request failed (${res.status})`, 'requestFailed')
  }

  return schema.parse(body)
}

export function jsonBody(method: 'POST' | 'PATCH', body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) }
}
