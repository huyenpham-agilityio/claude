import type { Prisma } from './generated/prisma/client.ts'

// Transaction dates are calendar days, stored as midnight UTC.
export const toDate = (day: string) => new Date(`${day}T00:00:00Z`)
export const toDay = (date: Date) => date.toISOString().slice(0, 10)

// Covers every day of a "YYYY-MM" month.
export function monthRange(month: string): Prisma.DateTimeFilter {
  const [year, monthNumber] = month.split('-').map(Number) as [number, number]
  return {
    gte: new Date(Date.UTC(year, monthNumber - 1, 1)),
    lt: new Date(Date.UTC(year, monthNumber, 1)),
  }
}

// Every "YYYY-MM" from `from` to `to`, inclusive.
export function monthsInRange(from: string, to: string): string[] {
  const months: string[] = []
  let [year, month] = from.split('-').map(Number) as [number, number]
  for (let current = from; current <= to; ) {
    months.push(current)
    month += 1
    if (month > 12) [year, month] = [year + 1, 1]
    current = `${year}-${String(month).padStart(2, '0')}`
  }
  return months
}

// From the first day of `from` up to, not including, the month after `to`.
export function monthSpan(from: string, to: string): Prisma.DateTimeFilter {
  return { gte: monthRange(from).gte, lt: monthRange(to).lt }
}
