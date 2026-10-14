import { type MonthRange, reportSchema } from '@expenses/shared'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiFetch } from './api.ts'
import { currentMonth, shiftMonth } from './dates.ts'

export const RANGE_PRESETS = {
  'last-3': 'Last 3 months',
  'last-6': 'Last 6 months',
  'last-12': 'Last 12 months',
  'this-year': 'This year',
} as const

export type RangePreset = keyof typeof RANGE_PRESETS

export function isRangePreset(value: unknown): value is RangePreset {
  return typeof value === 'string' && value in RANGE_PRESETS
}

// Every preset ends with the current month.
export function presetRange(preset: RangePreset, month = currentMonth()): MonthRange {
  switch (preset) {
    case 'last-3':
      return { from: shiftMonth(month, -2), to: month }
    case 'last-6':
      return { from: shiftMonth(month, -5), to: month }
    case 'last-12':
      return { from: shiftMonth(month, -11), to: month }
    case 'this-year':
      return { from: `${month.slice(0, 4)}-01`, to: month }
  }
}

export function useReport({ from, to }: MonthRange) {
  return useQuery({
    queryKey: ['transactions', 'report', from, to],
    queryFn: () => apiFetch(`/reports/summary?from=${from}&to=${to}`, reportSchema),
    // Keep the old charts on screen while a new range loads.
    placeholderData: keepPreviousData,
  })
}

export function csvExportUrl({ from, to }: MonthRange): string {
  return `/api/reports/transactions.csv?from=${from}&to=${to}`
}
