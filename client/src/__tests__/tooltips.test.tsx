import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { setLanguage } from '@/lib/language'
import { signedInHandlers } from './fixtures.ts'
import { mockApi, renderApp } from './renderApp.tsx'

afterEach(() => vi.unstubAllGlobals())

// Radix puts a hidden copy of the text in the tooltip for screen readers.
const tooltip = () => screen.findByRole('tooltip')

describe('icon button tooltips', () => {
  it('shows on hover and hides when the pointer leaves', async () => {
    mockApi(signedInHandlers())
    renderApp('/budgets?month=2026-10')
    const next = await screen.findByRole('button', { name: 'Next month' })

    await userEvent.hover(next)
    expect(await tooltip()).toHaveTextContent('Next month')

    // Radix keeps the tooltip while the pointer is in the gap towards it, so
    // move the pointer well away, as a real mouse would.
    await userEvent.unhover(next)
    fireEvent.pointerMove(document.body, { clientX: 900, clientY: 900 })
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
  })

  it('shows on keyboard focus and hides on Escape', async () => {
    mockApi(signedInHandlers())
    renderApp('/budgets?month=2026-10')
    const edit = await screen.findByRole('button', { name: 'Edit Groceries budget' })

    await userEvent.tab()
    edit.focus()
    expect(await tooltip()).toHaveTextContent('Edit budget')

    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('tooltip')).not.toBeInTheDocument())
  })

  it('keeps each button name the same, so screen readers hear it once', async () => {
    mockApi(signedInHandlers())
    renderApp('/budgets?month=2026-10')

    expect(await screen.findAllByRole('button', { name: 'Delete Groceries budget' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Previous month' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Log out' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: /theme$/ })).toHaveLength(1)
  })

  it('does not replace the native title tooltip with a second one', async () => {
    mockApi(signedInHandlers())
    renderApp('/')
    const logOut = await screen.findByRole('button', { name: 'Log out' })

    expect(logOut).not.toHaveAttribute('title')
  })

  it('performs the action on a plain click, without waiting for the tooltip', async () => {
    mockApi(signedInHandlers())
    renderApp('/budgets?month=2026-10')
    await userEvent.click(await screen.findByRole('button', { name: 'Next month' }))

    expect(await screen.findByText('November 2026')).toBeInTheDocument()
  })

  it('explains a disabled Delete on a category that still has transactions', async () => {
    mockApi(signedInHandlers())
    renderApp('/categories')
    const row = (await screen.findByText('Groceries')).closest('li')!
    const remove = row.querySelector('button[disabled]')!
    expect(remove).toHaveAccessibleName('Delete Groceries')

    // The disabled button can't take focus, so its wrapper does.
    remove.parentElement!.focus()
    expect(await tooltip()).toHaveTextContent('Move or delete its transactions first')
  })

  it('shows a plain Delete tooltip on a category that is not in use', async () => {
    mockApi(signedInHandlers())
    renderApp('/categories')
    const rent = await screen.findByRole('button', { name: 'Delete Rent' })

    await userEvent.hover(rent)
    expect(await tooltip()).toHaveTextContent('Delete category')
  })

  it('is written in the current language', async () => {
    setLanguage('vi')
    mockApi(signedInHandlers())
    renderApp('/budgets?month=2026-10')
    const next = await screen.findByRole('button', { name: 'Tháng sau' })

    await userEvent.hover(next)
    expect(await tooltip()).toHaveTextContent('Tháng sau')
  })
})
