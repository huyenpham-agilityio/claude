import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { routes } from '../routes.tsx'

type Handler = (body: unknown) => Response
type Handlers = Record<string, Handler>

// Stubs fetch with handlers keyed like "POST /api/auth/login".
export function mockApi(handlers: Handlers) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const key = `${init?.method ?? 'GET'} ${String(input)}`
    const handler = handlers[key]
    if (!handler) throw new Error(`Unhandled request: ${key}`)
    return handler(typeof init?.body === 'string' ? JSON.parse(init.body) : undefined)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export function renderApp(initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}
