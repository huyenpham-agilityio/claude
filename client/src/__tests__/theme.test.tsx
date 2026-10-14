import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { signedInHandlers } from './fixtures.ts'
import { mockApi, renderApp } from './renderApp.tsx'

const html = document.documentElement

beforeEach(() => {
  localStorage.clear()
  html.classList.remove('dark')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('theme toggle', () => {
  it('steps through system, light, and dark, and remembers the choice', async () => {
    mockApi(signedInHandlers())
    renderApp('/')

    const toggle = await screen.findByRole('button', { name: 'Theme: System. Switch to Light' })
    expect(html).not.toHaveClass('dark')

    await userEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Theme: Light. Switch to Dark' })).toBeInTheDocument()
    expect(localStorage.getItem('theme')).toBe('light')

    await userEvent.click(screen.getByRole('button', { name: /^Theme: Light/ }))
    expect(html).toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBe('dark')

    await userEvent.click(screen.getByRole('button', { name: /^Theme: Dark/ }))
    expect(html).not.toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBeNull()
  })

  it('starts dark when the system prefers it', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          matches: true,
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    )
    mockApi(signedInHandlers())
    renderApp('/')

    await screen.findByRole('button', { name: /^Theme: System/ })
    expect(html).toHaveClass('dark')
  })

  it('starts from a saved choice', async () => {
    localStorage.setItem('theme', 'dark')
    mockApi(signedInHandlers())
    renderApp('/')

    expect(await screen.findByRole('button', { name: /^Theme: Dark/ })).toBeInTheDocument()
    expect(html).toHaveClass('dark')
  })

  it('is available before signing in', async () => {
    mockApi({
      'GET /api/auth/me': () => Response.json({ error: { message: 'Not signed in' } }, { status: 401 }),
    })
    renderApp('/login')

    expect(await screen.findByRole('button', { name: /^Theme: / })).toBeInTheDocument()
  })
})
