import { currentLocaleTag } from './language.ts'

// Months are "YYYY-MM" and days are "YYYY-MM-DD", both in local time.

const pad = (value: number) => String(value).padStart(2, '0')

export function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

export function currentMonth(): string {
  return today().slice(0, 7)
}

export function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split('-').map(Number) as [number, number]
  const shifted = new Date(year, monthNumber - 1 + delta, 1)
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}`
}

export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number) as [number, number]
  return new Date(year, monthNumber - 1, 1).toLocaleDateString(currentLocaleTag(), {
    month: 'long',
    year: 'numeric',
  })
}

export function formatDay(day: string): string {
  const [year, monthNumber, date] = day.split('-').map(Number) as [number, number, number]
  return new Date(year, monthNumber - 1, date).toLocaleDateString(currentLocaleTag(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

// A full date for things that may be far off, like a savings target.
export function formatLongDate(day: string): string {
  const [year, monthNumber, date] = day.split('-').map(Number) as [number, number, number]
  return new Date(year, monthNumber - 1, date).toLocaleDateString(currentLocaleTag(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
