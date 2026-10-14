import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi, renderApp } from './test/renderApp.tsx'

const user = { id: 'u1', email: 'me@example.com', currency: 'VND' }
const signedOut = () => Response.json({ error: { message: 'Not signed in' } }, { status: 401 })
const signedIn = () => Response.json({ user })

afterEach(() => vi.unstubAllGlobals())

describe('route protection', () => {
  it('sends a signed-out visitor to the login page', async () => {
    mockApi({ 'GET /api/auth/me': signedOut })

    const router = renderApp('/')

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('shows the home page to a signed-in user', async () => {
    mockApi({ 'GET /api/auth/me': signedIn })

    renderApp('/')

    expect(await screen.findByText(/signed in as me@example\.com/)).toBeInTheDocument()
  })

  it('keeps a signed-in user out of the login page', async () => {
    mockApi({ 'GET /api/auth/me': signedIn })

    const router = renderApp('/login')

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })
})

describe('login', () => {
  it('validates before calling the API', async () => {
    const fetchMock = mockApi({ 'GET /api/auth/me': signedOut })
    renderApp('/login')

    await userEvent.click(await screen.findByRole('button', { name: 'Log in' }))

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()
    expect(screen.getByText('Enter your password')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('signs in and then logs out', async () => {
    const login = vi.fn(signedIn)
    mockApi({
      'GET /api/auth/me': signedOut,
      'POST /api/auth/login': login,
      'POST /api/auth/logout': () => Response.json({ ok: true }),
    })
    const router = renderApp('/login')

    await userEvent.type(await screen.findByLabelText('Email'), ' Me@Example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByText(/signed in as me@example\.com/)).toBeInTheDocument()
    expect(login).toHaveBeenCalledWith({ email: 'me@example.com', password: 'correct-horse' })

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }))

    expect(await screen.findByRole('heading', { name: 'Log in' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('shows the server error for wrong credentials', async () => {
    mockApi({
      'GET /api/auth/me': signedOut,
      'POST /api/auth/login': () =>
        Response.json({ error: { message: 'Incorrect email or password' } }, { status: 401 }),
    })
    renderApp('/login')

    await userEvent.type(await screen.findByLabelText('Email'), 'me@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password')
  })
})

describe('register', () => {
  it('rejects a short password', async () => {
    mockApi({ 'GET /api/auth/me': signedOut })
    renderApp('/register')

    await userEvent.type(await screen.findByLabelText('Email'), 'me@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'short')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('Password must be at least 8 characters')).toBeInTheDocument()
  })

  it('creates the account and lands on the home page', async () => {
    mockApi({
      'GET /api/auth/me': signedOut,
      'POST /api/auth/register': () => Response.json({ user }, { status: 201 }),
    })
    const router = renderApp('/register')

    await userEvent.type(await screen.findByLabelText('Email'), 'me@example.com')
    await userEvent.type(screen.getByLabelText('Password'), 'correct-horse')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText(/signed in as me@example\.com/)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })
})
