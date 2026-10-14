import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { currentMonth, shiftMonth, today } from '../lib/dates.ts'
import { listResponse, signedInHandlers, transactions } from './fixtures.ts'
import { mockApi, renderApp } from './renderApp.tsx'

afterEach(() => vi.unstubAllGlobals())

const ok = () => Response.json({ ok: true })

describe('transactions page', () => {
  it('lists transactions by day with totals', async () => {
    mockApi(signedInHandlers())
    renderApp('/transactions?month=2026-10')

    const groceries = (await screen.findByText('Weekly market')).closest('li')!
    expect(within(groceries).getByText('Groceries')).toBeInTheDocument()
    expect(within(groceries).getByText(/^−.*200,000/)).toBeInTheDocument()

    const net = screen.getByText('Net').parentElement!
    expect(net).toHaveTextContent('29,800,000')
    expect(screen.getByText('October 2026')).toBeInTheDocument()
  })

  it('asks the API for the month in the URL and steps between months', async () => {
    const list = vi.fn((_body: unknown, _query: URLSearchParams) => Response.json(listResponse()))
    mockApi({ ...signedInHandlers(), 'GET /api/transactions': list })
    renderApp('/transactions?month=2026-01')

    await screen.findByText('January 2026')
    expect(list.mock.lastCall![1].get('month')).toBe('2026-01')

    await userEvent.click(screen.getByRole('button', { name: 'Previous month' }))

    expect(await screen.findByText('December 2025')).toBeInTheDocument()
    await waitFor(() => expect(list.mock.lastCall![1].get('month')).toBe('2025-12'))
  })

  it('defaults to the current month and passes filters on', async () => {
    const list = vi.fn((_body: unknown, _query: URLSearchParams) => Response.json(listResponse()))
    mockApi({ ...signedInHandlers(), 'GET /api/transactions': list })
    const router = renderApp('/transactions')

    await screen.findByText('Weekly market')
    expect(list.mock.lastCall![1].get('month')).toBe(currentMonth())

    await userEvent.selectOptions(screen.getByLabelText('Type'), 'Income')
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Salary')
    await userEvent.type(screen.getByLabelText('Search notes and categories'), 'bonus')

    await waitFor(() => expect(list.mock.lastCall![1].get('q')).toBe('bonus'))
    expect(list.mock.lastCall![1].get('type')).toBe('income')
    expect(list.mock.lastCall![1].get('categoryId')).toBe('c-salary')
    expect(router.state.location.search).toContain('q=bonus')
  })

  it('explains an empty month', async () => {
    mockApi({
      ...signedInHandlers(),
      'GET /api/transactions': () => Response.json(listResponse([])),
    })
    renderApp(`/transactions?month=${shiftMonth('2026-10', 1)}`)

    expect(await screen.findByText('No transactions in November 2026 yet.')).toBeInTheDocument()
  })
})

describe('adding a transaction', () => {
  async function openDialog(create = vi.fn((_body: unknown) => Response.json({}))) {
    mockApi({ ...signedInHandlers(), 'POST /api/transactions': create })
    renderApp('/transactions?month=2026-10')
    await screen.findByText('Weekly market')
    await userEvent.click(screen.getByRole('button', { name: 'Add transaction' }))
    return { dialog: await screen.findByRole('dialog'), create }
  }

  it('sends the amount as a whole number and closes', async () => {
    const create = vi.fn((_body: unknown) =>
      Response.json({ transaction: transactions[1] }, { status: 201 }),
    )
    const { dialog } = await openDialog(create)

    await userEvent.type(within(dialog).getByLabelText('Amount (VND)'), '50.000')
    await userEvent.selectOptions(within(dialog).getByLabelText('Category'), 'Rent')
    await userEvent.type(within(dialog).getByLabelText('Note (optional)'), ' October ')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add transaction' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(create.mock.calls[0]![0]).toEqual({
      categoryId: 'c-rent',
      amount: 50_000,
      date: today(),
      note: 'October',
    })
  })

  it('offers only the categories for the chosen type', async () => {
    const { dialog } = await openDialog()
    const optionNames = () =>
      within(within(dialog).getByLabelText('Category'))
        .getAllByRole('option')
        .map((option) => option.textContent)

    expect(optionNames()).toEqual(['Groceries', 'Rent'])

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Income' }))

    expect(optionNames()).toEqual(['Salary'])
    expect(within(dialog).getByLabelText('Category')).toHaveValue('c-salary')
  })

  it('validates the amount before calling the API', async () => {
    const { dialog, create } = await openDialog()

    await userEvent.click(within(dialog).getByRole('button', { name: 'Add transaction' }))
    expect(await within(dialog).findByText('Enter an amount')).toBeInTheDocument()

    await userEvent.type(within(dialog).getByLabelText('Amount (VND)'), '0')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add transaction' }))
    expect(await within(dialog).findByText('Amount must be greater than zero')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('shows a server error and stays open', async () => {
    const { dialog } = await openDialog(
      vi.fn(() =>
        Response.json({ error: { message: 'Choose one of your categories' } }, { status: 400 }),
      ),
    )

    await userEvent.type(within(dialog).getByLabelText('Amount (VND)'), '1000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add transaction' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Choose one of your categories',
    )
  })
})

describe('changing a transaction', () => {
  it('prefills the form and saves changes', async () => {
    const update = vi.fn((_body: unknown) => Response.json({ transaction: transactions[1] }))
    mockApi({ ...signedInHandlers(), 'PATCH /api/transactions/t-groceries': update })
    renderApp('/transactions?month=2026-10')

    await userEvent.click(await screen.findByRole('button', { name: /^Edit Groceries/ }))
    const dialog = await screen.findByRole('dialog')
    const amount = within(dialog).getByLabelText('Amount (VND)')

    expect(amount).toHaveValue('200000')
    expect(within(dialog).getByLabelText('Note (optional)')).toHaveValue('Weekly market')
    expect(within(dialog).getByLabelText('Date')).toHaveValue('2026-10-03')

    await userEvent.clear(amount)
    await userEvent.type(amount, '250000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(update.mock.calls[0]![0]).toEqual({
      categoryId: 'c-groceries',
      amount: 250_000,
      date: '2026-10-03',
      note: 'Weekly market',
    })
  })

  it('deletes only after confirming', async () => {
    const remove = vi.fn(ok)
    mockApi({ ...signedInHandlers(), 'DELETE /api/transactions/t-groceries': remove })
    renderApp('/transactions?month=2026-10')

    await userEvent.click(await screen.findByRole('button', { name: /^Delete Groceries/ }))
    const confirm = await screen.findByRole('alertdialog')
    expect(remove).not.toHaveBeenCalled()

    await userEvent.click(within(confirm).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(remove).toHaveBeenCalledTimes(1)
  })
})
