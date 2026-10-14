import type { Budget } from '@expenses/shared'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { budgetListResponse, budgets, signedInHandlers } from './test/fixtures.ts'
import { mockApi, renderApp } from './test/renderApp.tsx'

afterEach(() => vi.unstubAllGlobals())

const groceries = budgets[0]!
const withSpent = (spent: number): Budget => ({ ...groceries, spent })

function renderBudgets(items: Budget[], copyFrom: string | null = null) {
  const handlers = {
    ...signedInHandlers(),
    'GET /api/budgets': () => Response.json(budgetListResponse(items, copyFrom)),
  }
  return { handlers, render: () => renderApp('/budgets?month=2026-10') }
}

async function groceriesRow() {
  return (await screen.findByRole('progressbar', { name: 'Groceries budget' })).closest('li')!
}

describe('budget progress', () => {
  it('shows spending against the limit', async () => {
    const { handlers, render } = renderBudgets([withSpent(800_000)])
    mockApi(handlers)
    render()

    const row = await groceriesRow()
    expect(row).toHaveTextContent('₫800,000 of ₫2,000,000')
    expect(within(row).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40')
    expect(within(row).getByText('40% used')).toBeInTheDocument()
  })

  it('warns from 80% of the limit', async () => {
    const { handlers, render } = renderBudgets([withSpent(1_700_000)])
    mockApi(handlers)
    render()

    expect(within(await groceriesRow()).getByText('85% used, close to the limit')).toBeInTheDocument()
  })

  it('says when the limit is reached exactly', async () => {
    const { handlers, render } = renderBudgets([withSpent(2_000_000)])
    mockApi(handlers)
    render()

    expect(within(await groceriesRow()).getByText('Limit reached')).toBeInTheDocument()
  })

  it('says how far over the limit spending is', async () => {
    const { handlers, render } = renderBudgets([withSpent(2_300_000)])
    mockApi(handlers)
    render()

    const row = await groceriesRow()
    expect(within(row).getByText('Over by ₫300,000')).toBeInTheDocument()
    expect(within(row).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('totals all budgets', async () => {
    const rent: Budget = {
      id: 'b-rent',
      month: '2026-10',
      limitAmount: 8_000_000,
      spent: 8_000_000,
      category: { id: 'c-rent', name: 'Rent', color: '#6366f1' },
    }
    const { handlers, render } = renderBudgets([withSpent(800_000), rent])
    mockApi(handlers)
    render()

    const total = (await screen.findByRole('progressbar', { name: 'All budgets' })).parentElement!
      .parentElement!
    expect(total).toHaveTextContent('₫8,800,000 of ₫10,000,000')
    expect(total).toHaveTextContent('88% used, close to the limit')
  })
})

describe('managing budgets', () => {
  it('offers only expense categories without a budget, and saves the limit', async () => {
    const save = vi.fn((_body: unknown) => Response.json({ budget: groceries }))
    const { handlers, render } = renderBudgets([groceries])
    mockApi({ ...handlers, 'PUT /api/budgets': save })
    render()

    await groceriesRow()
    await userEvent.click(screen.getByRole('button', { name: 'Set budget' }))
    const dialog = await screen.findByRole('dialog')
    const options = within(within(dialog).getByLabelText('Category')).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['Rent'])

    await userEvent.type(within(dialog).getByLabelText('Monthly limit (VND)'), '8.000.000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Set budget' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(save.mock.calls[0]![0]).toEqual({
      categoryId: 'c-rent',
      month: '2026-10',
      limitAmount: 8_000_000,
    })
  })

  it('edits the limit of an existing budget', async () => {
    const save = vi.fn((_body: unknown) => Response.json({ budget: groceries }))
    const { handlers, render } = renderBudgets([groceries])
    mockApi({ ...handlers, 'PUT /api/budgets': save })
    render()

    await userEvent.click(await screen.findByRole('button', { name: 'Edit Groceries budget' }))
    const dialog = await screen.findByRole('dialog')
    const limit = within(dialog).getByLabelText('Monthly limit (VND)')
    expect(limit).toHaveValue('2000000')
    expect(within(dialog).getByLabelText('Category')).toBeDisabled()

    await userEvent.clear(limit)
    await userEvent.type(limit, '2500000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(save).toHaveBeenCalled())
    expect(save.mock.calls[0]![0]).toEqual({
      categoryId: 'c-groceries',
      month: '2026-10',
      limitAmount: 2_500_000,
    })
  })

  it('requires a limit', async () => {
    const { handlers, render } = renderBudgets([])
    const fetchMock = mockApi(handlers)
    render()

    await userEvent.click(await screen.findByRole('button', { name: 'Set budget' }))
    const dialog = await screen.findByRole('dialog')
    const callsBefore = fetchMock.mock.calls.length
    await userEvent.click(within(dialog).getByRole('button', { name: 'Set budget' }))

    expect(await within(dialog).findByText('Enter an amount')).toBeInTheDocument()
    expect(fetchMock.mock.calls.length).toBe(callsBefore)
  })

  it('deletes after confirming', async () => {
    const remove = vi.fn(() => Response.json({ ok: true }))
    const { handlers, render } = renderBudgets([groceries])
    mockApi({ ...handlers, 'DELETE /api/budgets/b-groceries': remove })
    render()

    await userEvent.click(await screen.findByRole('button', { name: 'Delete Groceries budget' }))
    const confirm = await screen.findByRole('alertdialog')
    expect(remove).not.toHaveBeenCalled()
    await userEvent.click(within(confirm).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1))
  })
})

describe('an empty month', () => {
  it('offers to copy from the latest month with budgets', async () => {
    const copy = vi.fn((_body: unknown) => Response.json({ ok: true }, { status: 201 }))
    const { handlers, render } = renderBudgets([], '2026-08')
    mockApi({ ...handlers, 'POST /api/budgets/copy': copy })
    render()

    expect(await screen.findByText('No budgets for October 2026 yet.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Copy budgets from August 2026' }))

    await waitFor(() => expect(copy).toHaveBeenCalled())
    expect(copy.mock.calls[0]![0]).toEqual({ from: '2026-08', to: '2026-10' })
  })

  it('has nothing to copy for a first month', async () => {
    const { handlers, render } = renderBudgets([])
    mockApi(handlers)
    render()

    expect(await screen.findByText('No budgets for October 2026 yet.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Copy budgets/ })).not.toBeInTheDocument()
  })
})
