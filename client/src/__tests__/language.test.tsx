import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setLanguage } from '@/lib/language'
import { signedInHandlers, user } from './fixtures.ts'
import { mockApi, renderApp } from './renderApp.tsx'

const signedOut = () =>
  Response.json({ error: { code: 'notSignedIn', message: 'Not signed in' } }, { status: 401 })

afterEach(() => vi.unstubAllGlobals())

describe('language switch', () => {
  it('translates the page at once and remembers the choice', async () => {
    mockApi({ 'GET /api/auth/me': signedOut })
    renderApp('/login')
    await screen.findByRole('heading', { name: 'Log in' })

    await userEvent.click(screen.getByRole('button', { name: 'Tiếng Việt' }))

    expect(screen.getByRole('heading', { name: 'Đăng nhập' })).toBeInTheDocument()
    expect(screen.getByLabelText('Mật khẩu')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('vi')
    expect(localStorage.getItem('language')).toBe('vi')

    await userEvent.click(screen.getByRole('button', { name: 'English' }))
    expect(screen.getByRole('heading', { name: 'Log in' })).toBeInTheDocument()
  })

  it('translates a validation error already on screen', async () => {
    mockApi({ 'GET /api/auth/me': signedOut })
    renderApp('/login')

    await userEvent.click(await screen.findByRole('button', { name: 'Log in' }))
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Tiếng Việt' }))
    expect(screen.getByText('Nhập địa chỉ email hợp lệ')).toBeInTheDocument()
    expect(screen.getByText('Nhập mật khẩu')).toBeInTheDocument()
  })

  it('shows server errors in Vietnamese', async () => {
    setLanguage('vi')
    mockApi({
      'GET /api/auth/me': signedOut,
      'POST /api/auth/login': () =>
        Response.json(
          { error: { code: 'invalidCredentials', message: 'Email or password is incorrect' } },
          { status: 401 },
        ),
    })
    renderApp('/login')

    await userEvent.type(await screen.findByLabelText('Email'), 'me@example.com')
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu không đúng')
  })

  it('creates a new account in the language on screen', async () => {
    setLanguage('vi')
    const register = vi.fn((_body: unknown) => Response.json({ user }, { status: 201 }))
    mockApi({ ...signedInHandlers(), 'GET /api/auth/me': signedOut, 'POST /api/auth/register': register })
    renderApp('/register')

    await userEvent.type(await screen.findByLabelText('Email'), 'new@example.com')
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'long-enough')
    await userEvent.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))

    expect(await screen.findByRole('heading', { name: 'Tổng quan' })).toBeInTheDocument()
    expect(register.mock.calls[0]![0]).toEqual({
      email: 'new@example.com',
      password: 'long-enough',
      locale: 'vi',
    })
  })

  it('shows money and months the Vietnamese way', async () => {
    setLanguage('vi')
    mockApi(signedInHandlers())
    renderApp('/?month=2026-10')

    expect(await screen.findByText('tháng 10 năm 2026')).toBeInTheDocument()
    const income = screen.getByText('Thu nhập').closest('div')!
    expect(await within(income).findByText(/^30\.000\.000\s₫$/)).toBeInTheDocument()
  })
})
