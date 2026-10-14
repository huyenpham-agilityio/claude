import type { Goal } from '@expenses/shared'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { goals, signedInHandlers } from './fixtures.ts'
import { mockApi, renderApp } from './renderApp.tsx'

afterEach(() => vi.unstubAllGlobals())

const trip = goals[0]!

function withGoals(items: Goal[]) {
  return { ...signedInHandlers(), 'GET /api/goals': () => Response.json({ goals: items }) }
}

async function card(name: string) {
  return (await screen.findByRole('heading', { name })).closest('li')!
}

describe('savings page', () => {
  it('shows progress for each goal', async () => {
    mockApi(withGoals([trip, { ...trip, id: 'g-done', name: 'Laptop', savedAmount: 60_000_000 }]))
    renderApp('/savings')

    const tripCard = await card('Trip to Japan')
    expect(tripCard).toHaveTextContent('₫15,000,000 of ₫60,000,000')
    expect(within(tripCard).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25')
    expect(within(await card('Laptop')).getByText('Goal reached')).toBeInTheDocument()
  })

  it('explains an empty list', async () => {
    mockApi(withGoals([]))
    renderApp('/savings')

    expect(await screen.findByText(/No savings goals yet/)).toBeInTheDocument()
  })

  it('creates a goal with an optional date', async () => {
    const create = vi.fn((_body: unknown) => Response.json({ goal: trip }, { status: 201 }))
    mockApi({ ...withGoals([]), 'POST /api/goals': create })
    renderApp('/savings')

    await userEvent.click(await screen.findByRole('button', { name: 'New goal' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Name'), 'Emergency fund')
    await userEvent.type(within(dialog).getByLabelText('Target (VND)'), '100.000.000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create goal' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(create.mock.calls[0]![0]).toEqual({
      name: 'Emergency fund',
      targetAmount: 100_000_000,
      targetDate: null,
    })
  })

  it('edits a goal, keeping its date', async () => {
    const update = vi.fn((_body: unknown) => Response.json({ goal: trip }))
    mockApi({ ...withGoals([trip]), 'PATCH /api/goals/g-trip': update })
    renderApp('/savings')

    await userEvent.click(await screen.findByRole('button', { name: 'Edit Trip to Japan' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Target date (optional)')).toHaveValue('2027-04-01')
    const target = within(dialog).getByLabelText('Target (VND)')
    await userEvent.clear(target)
    await userEvent.type(target, '70000000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(update).toHaveBeenCalled())
    expect(update.mock.calls[0]![0]).toEqual({
      name: 'Trip to Japan',
      targetAmount: 70_000_000,
      targetDate: '2027-04-01',
    })
  })

  it('adds money', async () => {
    const contribute = vi.fn((_body: unknown) => Response.json({ goal: trip }))
    mockApi({ ...withGoals([trip]), 'POST /api/goals/g-trip/contributions': contribute })
    renderApp('/savings')

    await userEvent.click(await screen.findByRole('button', { name: 'Add money to Trip to Japan' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Amount (VND)'), '2.000.000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add money' }))

    await waitFor(() => expect(contribute).toHaveBeenCalled())
    expect(contribute.mock.calls[0]![0]).toEqual({ amount: 2_000_000 })
  })

  it('takes money out as a negative amount, but not more than is saved', async () => {
    const contribute = vi.fn((_body: unknown) => Response.json({ goal: trip }))
    mockApi({ ...withGoals([trip]), 'POST /api/goals/g-trip/contributions': contribute })
    renderApp('/savings')

    await userEvent.click(await screen.findByRole('button', { name: 'Take money from Trip to Japan' }))
    const dialog = await screen.findByRole('dialog')
    const amount = within(dialog).getByLabelText('Amount (VND)')

    await userEvent.type(amount, '20000000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Take out' }))
    expect(await within(dialog).findByText('Only ₫15,000,000 is saved')).toBeInTheDocument()
    expect(contribute).not.toHaveBeenCalled()

    await userEvent.clear(amount)
    await userEvent.type(amount, '5000000')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Take out' }))

    await waitFor(() => expect(contribute).toHaveBeenCalled())
    expect(contribute.mock.calls[0]![0]).toEqual({ amount: -5_000_000 })
  })

  it('cannot take money from an empty goal', async () => {
    mockApi(withGoals([{ ...trip, savedAmount: 0 }]))
    renderApp('/savings')

    expect(
      await screen.findByRole('button', { name: 'Take money from Trip to Japan' }),
    ).toBeDisabled()
  })

  it('deletes after confirming', async () => {
    const remove = vi.fn(() => Response.json({ ok: true }))
    mockApi({ ...withGoals([trip]), 'DELETE /api/goals/g-trip': remove })
    renderApp('/savings')

    await userEvent.click(await screen.findByRole('button', { name: 'Delete Trip to Japan' }))
    const confirm = await screen.findByRole('alertdialog')
    await userEvent.click(within(confirm).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1))
  })
})
