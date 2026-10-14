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
