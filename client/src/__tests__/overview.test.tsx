import type { Budget } from '@expenses/shared'
import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { currentMonth } from '../lib/dates.ts'
import { budgetListResponse, budgets, listResponse, signedInHandlers, transactions } from './fixtures.ts'
import { mockApi, renderApp } from './renderApp.tsx'

afterEach(() => vi.unstubAllGlobals())

const tile = (label: string) => screen.getByText(label, { selector: 'dt' }).parentElement!
const panel = async (title: string) =>
  (await screen.findByRole('heading', { name: title })).closest('section')!

describe('overview', () => {
  it('summarises the month with last month for comparison', async () => {
    const list = vi.fn((_body: unknown, query: URLSearchParams) =>
      Response.json(
        query.get('month') === '2026-10'
          ? listResponse()
          : { ...listResponse([]), totals: { income: 25_000_000, expense: 9_000_000 } },
      ),
    )
    mockApi({ ...signedInHandlers(), 'GET /api/transactions': list })
    renderApp('/?month=2026-10')

    await waitFor(() => expect(tile('Income')).toHaveTextContent('₫30,000,000'))
    expect(tile('Income')).toHaveTextContent('September 2026: ₫25,000,000')
    expect(tile('Expenses')).toHaveTextContent('₫200,000')
    expect(tile('Expenses')).toHaveTextContent('September 2026: ₫9,000,000')
    expect(tile('Net')).toHaveTextContent('₫29,800,000')
    expect(tile('Savings rate')).toHaveTextContent('99%')
  })

  it('defaults to the current month', async () => {
    const list = vi.fn((_body: unknown, _query: URLSearchParams) => Response.json(listResponse()))
    mockApi({ ...signedInHandlers(), 'GET /api/transactions': list })
    renderApp('/')

    await screen.findByRole('heading', { name: 'Overview' })
    await waitFor(() =>
      expect(list.mock.calls.map((call) => call[1].get('month'))).toContain(currentMonth()),
    )
  })

  it('has no savings rate without income', async () => {
    mockApi({
      ...signedInHandlers(),
      'GET /api/transactions': () => Response.json(listResponse([transactions[1]!])),
    })
    renderApp('/?month=2026-10')

    await waitFor(() => expect(tile('Savings rate')).toHaveTextContent('No income recorded'))
  })

  it('lists budgets that need attention, worst first', async () => {
    const over: Budget = {
      id: 'b-eating',
      month: '2026-10',
      limitAmount: 1_000_000,
      spent: 1_350_000,
      category: { id: 'c-eating', name: 'Eating out', color: '#ef4444' },
    }
    const close: Budget = { ...budgets[0]!, spent: 1_700_000 }
    const fine: Budget = { ...budgets[0]!, id: 'b-fine', category: { ...budgets[0]!.category, name: 'Health' } }
    mockApi({
      ...signedInHandlers(),
      'GET /api/budgets': () => Response.json(budgetListResponse([close, fine, over])),
    })
    renderApp('/?month=2026-10')

    const budgetsPanel = await panel('Budgets')
    await waitFor(() => expect(within(budgetsPanel).getAllByRole('listitem')).toHaveLength(2))
    const [first, second] = within(budgetsPanel).getAllByRole('listitem')
    expect(first).toHaveTextContent('Eating outOver by ₫350,000')
    expect(second).toHaveTextContent('Groceries85% used')
    expect(budgetsPanel).not.toHaveTextContent('Health')
  })

  it('says when every budget is on track', async () => {
    mockApi(signedInHandlers())
    renderApp('/?month=2026-10')

    expect(await within(await panel('Budgets')).findByText('Your budget is on track.')).toBeInTheDocument()
  })

  it('shows recent transactions and goals', async () => {
    mockApi(signedInHandlers())
    renderApp('/?month=2026-10')

    const recent = await panel('Recent transactions')
    expect(await within(recent).findByText(/Weekly market/)).toBeInTheDocument()
    expect(within(recent).getByText('+₫30,000,000')).toBeInTheDocument()

    const savings = await panel('Savings goals')
    expect(await within(savings).findByText('Trip to Japan')).toBeInTheDocument()
    expect(within(savings).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
    expect(within(savings).getByText('₫45,000,000 left')).toBeInTheDocument()
  })
})
