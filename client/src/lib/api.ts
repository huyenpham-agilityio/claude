import { apiErrorSchema } from '@expenses/shared'
import type { z } from 'zod'

export class ApiRequestError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
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
    throw new ApiRequestError(
      res.status,
      parsed.success ? parsed.data.error.message : `Request failed (${res.status})`,
    )
  }

  return schema.parse(body)
}

export function jsonBody(method: 'POST' | 'PATCH', body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) }
}
