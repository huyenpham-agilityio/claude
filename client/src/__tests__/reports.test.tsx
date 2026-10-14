import type { Report } from '@expenses/shared'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { currentMonth, shiftMonth } from '../lib/dates.ts'
import { presetRange } from '../lib/reports.ts'
import { signedInHandlers } from './fixtures.ts'
import { mockApi, renderApp } from './renderApp.tsx'

afterEach(() => vi.unstubAllGlobals())

const report: Report = {
  from: '2026-09',
  to: '2026-10',
  months: [
    { month: '2026-09', income: 28_000_000, expense: 9_000_000 },
    { month: '2026-10', income: 30_000_000, expense: 11_000_000 },
  ],
  spendingByCategory: [
    { category: { id: 'c-rent', name: 'Rent', color: '#6366f1' }, amount: 16_000_000 },
    { category: { id: 'c-groceries', name: 'Groceries', color: '#22c55e' }, amount: 4_000_000 },
  ],
}

function renderReports(path = '/reports') {
  const summary = vi.fn((_body: unknown, _query: URLSearchParams) => Response.json(report))
  mockApi({ ...signedInHandlers(), 'GET /api/reports/summary': summary })
  renderApp(path)
  return summary
}

const tile = (label: string) => screen.getByText(label, { selector: 'dt' }).parentElement!

describe('presetRange', () => {
  it.each([
    ['last-3', '2026-08'],
    ['last-6', '2026-05'],
    ['last-12', '2025-11'],
    ['this-year', '2026-01'],
  ] as const)('%s ends this month and starts in %s', (preset, from) => {
    expect(presetRange(preset, '2026-10')).toEqual({ from, to: '2026-10' })
  })

  it('reaches back across a year boundary', () => {
    expect(presetRange('last-3', '2026-01')).toEqual({ from: '2025-11', to: '2026-01' })
  })
})

describe('reports page', () => {
  it('asks for the last six months by default', async () => {
    const summary = renderReports()

    await screen.findByText('Spending by category')
    const query = summary.mock.lastCall![1]
    expect(query.get('to')).toBe(currentMonth())
    expect(query.get('from')).toBe(shiftMonth(currentMonth(), -5))
  })

  it('switches period from the URL and the picker', async () => {
    const summary = renderReports('/reports?range=last-12')

    await screen.findByText('Spending by category')
    expect(summary.mock.lastCall![1].get('from')).toBe(shiftMonth(currentMonth(), -11))

    await userEvent.selectOptions(screen.getByLabelText('Period'), 'This year')

    await waitFor(() =>
      expect(summary.mock.lastCall![1].get('from')).toBe(`${currentMonth().slice(0, 4)}-01`),
    )
  })

  it('totals the period', async () => {
    renderReports()

    await waitFor(() => expect(tile('Income')).toHaveTextContent('₫58,000,000'))
    expect(tile('Expenses')).toHaveTextContent('₫20,000,000')
    expect(tile('Net')).toHaveTextContent('₫38,000,000')
    // Six months in the default period, even if some are empty.
    expect(tile('Average monthly spending')).toHaveTextContent('₫3,333,333')
  })

  it('ranks spending by category with each share', async () => {
    renderReports()

    const section = (await screen.findByText('Spending by category')).closest('section')!
    const rows = within(section).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('Rent₫16,000,00080%')
    expect(rows[1]).toHaveTextContent('Groceries₫4,000,00020%')
  })

  it('offers the monthly chart as a table', async () => {
    renderReports()

    await userEvent.click(await screen.findByRole('button', { name: 'Show table' }))

    const table = screen.getByRole('table')
    const october = within(table).getByRole('row', { name: /October 2026/ })
    expect(october).toHaveTextContent('₫30,000,000₫11,000,000₫19,000,000')
    expect(screen.getByRole('button', { name: 'Show chart' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('links the CSV export to the same period', async () => {
    renderReports('/reports?range=last-3')

    const link = await screen.findByRole('link', { name: 'Export CSV' })
    const { from, to } = presetRange('last-3')
    expect(link).toHaveAttribute('href', `/api/reports/transactions.csv?from=${from}&to=${to}`)
    expect(link).toHaveAttribute('download')
  })

  it('explains a period without spending', async () => {
    mockApi({
      ...signedInHandlers(),
      'GET /api/reports/summary': () => Response.json({ ...report, spendingByCategory: [] }),
    })
    renderApp('/reports')

    expect(await screen.findByText('No spending in this period.')).toBeInTheDocument()
  })
})
