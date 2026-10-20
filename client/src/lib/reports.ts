import { type MonthRange, reportSchema } from '@expenses/shared'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiFetch } from './api.ts'
import { currentMonth, shiftMonth } from './dates.ts'

// Each preset's label, as a translation key.
export const RANGE_PRESETS = {
  'last-3': 'reports.presets.last3',
  'last-6': 'reports.presets.last6',
  'last-12': 'reports.presets.last12',
  'this-year': 'reports.presets.thisYear',
} as const

export type RangePreset = keyof typeof RANGE_PRESETS

export function isRangePreset(value: unknown): value is RangePreset {
  return typeof value === 'string' && value in RANGE_PRESETS
}

export const DEFAULT_PRESET: RangePreset = 'last-6'

const STORAGE_KEY = 'reportsRange'

// The period the person last chose, or null if none (or storage is blocked).
export function readSavedPreset(): RangePreset | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isRangePreset(saved)) return saved
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
  return null
}

export function savePreset(preset: RangePreset) {
  try {
    localStorage.setItem(STORAGE_KEY, preset)
  } catch {
    // Not remembered, but still applied for this visit.
  }
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
