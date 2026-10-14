import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { signedInHandlers } from './fixtures.ts'
import { mockApi, renderApp } from './renderApp.tsx'

const html = document.documentElement

function systemPrefersDark() {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        matches: true,
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  )
}

beforeEach(() => {
  localStorage.clear()
  html.classList.remove('dark')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('theme toggle', () => {
  it('switches the page on every press and remembers the choice', async () => {
    mockApi(signedInHandlers())
    renderApp('/')

    await userEvent.click(await screen.findByRole('button', { name: 'Switch to dark theme' }))
    expect(html).toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBe('dark')

    await userEvent.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    expect(html).not.toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBe('light')
  })

  it('starts dark when the system prefers it, and the first press goes light', async () => {
    systemPrefersDark()
    mockApi(signedInHandlers())
    renderApp('/')

    const toggle = await screen.findByRole('button', { name: 'Switch to light theme' })
    expect(html).toHaveClass('dark')
    expect(localStorage.getItem('theme')).toBeNull()

    await userEvent.click(toggle)
    expect(html).not.toHaveClass('dark')
  })

  it('starts from a saved choice', async () => {
    localStorage.setItem('theme', 'dark')
    mockApi(signedInHandlers())
    renderApp('/')

    expect(await screen.findByRole('button', { name: 'Switch to light theme' })).toBeInTheDocument()
    expect(html).toHaveClass('dark')
  })

  it('is available before signing in', async () => {
    mockApi({
      'GET /api/auth/me': () => Response.json({ error: { message: 'Not signed in' } }, { status: 401 }),
    })
    renderApp('/login')

    expect(await screen.findByRole('button', { name: /^Switch to (dark|light) theme$/ })).toBeInTheDocument()
  })
})
