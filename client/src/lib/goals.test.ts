import type { Goal } from '@expenses/shared'
import { describe, expect, it } from 'vitest'
import { goalPace } from './goals.ts'

const goal = (overrides: Partial<Goal>): Goal => ({
  id: 'g',
  name: 'Goal',
  targetAmount: 1200,
  savedAmount: 0,
  targetDate: '2026-12-31',
  ...overrides,
})

describe('goalPace', () => {
  it('splits what is left over this month through the target month', () => {
    expect(goalPace(goal({ savedAmount: 300 }), '2026-10-14')).toEqual({
      kind: 'monthly',
      amount: 300,
      months: 3,
    })
  })

  it('rounds the monthly amount up so the goal is not missed', () => {
    expect(goalPace(goal({ targetAmount: 1000 }), '2026-10-14')).toMatchObject({ amount: 334 })
  })

  it('counts across a year boundary', () => {
    expect(goalPace(goal({ targetDate: '2027-02-01' }), '2026-11-30')).toMatchObject({
      months: 4,
    })
  })

  it('asks for everything this month when the target is this month', () => {
    expect(goalPace(goal({ targetDate: '2026-10-31' }), '2026-10-14')).toEqual({
      kind: 'monthly',
      amount: 1200,
      months: 1,
    })
  })

  it('reports a reached goal before anything else', () => {
    expect(goalPace(goal({ savedAmount: 1500, targetDate: '2020-01-01' }), '2026-10-14')).toEqual({
      kind: 'reached',
    })
  })

  it('reports a passed target date', () => {
    expect(goalPace(goal({ targetDate: '2026-10-13' }), '2026-10-14')).toEqual({ kind: 'overdue' })
  })

  it('has no pace without a target date', () => {
    expect(goalPace(goal({ targetDate: null }), '2026-10-14')).toEqual({ kind: 'no-date' })
  })
})
