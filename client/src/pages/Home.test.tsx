import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Home } from './Home.tsx'

function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <Home />
    </QueryClientProvider>,
  )
}

afterEach(() => vi.unstubAllGlobals())

describe('Home', () => {
  it('shows the API status once the health check succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ status: 'ok', db: 'up' })),
    )

    renderHome()

    expect(await screen.findByText('API ok, database up')).toBeInTheDocument()
  })

  it('reports when the API cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ error: { message: 'boom' } }, { status: 500 })),
    )

    renderHome()

    expect(await screen.findByText('API unreachable')).toBeInTheDocument()
  })
})
