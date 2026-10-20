import {
  type Report,
  currencyFractionDigits,
  monthRangeSchema,
} from '@expenses/shared'
import { Router } from 'express'
import { toCsv } from '../csv.ts'
import { monthSpan, monthsInRange, toDay } from '../dates.ts'
import { prisma } from '../db.ts'
import { currentUser, requireAuth } from '../middleware/auth.ts'

export const reportsRouter = Router()

reportsRouter.use(requireAuth)

// Totals per month and spending per category for a range of months. Rows are
// summed here rather than in SQL: a household's data is small, and it keeps
// the month grouping independent of the database.
reportsRouter.get('/summary', async (req, res) => {
  const { from, to } = monthRangeSchema.parse(req.query)

  const rows = await prisma.transaction.findMany({
    where: { userId: currentUser(req).id, date: monthSpan(from, to) },
    select: {
      date: true,
      type: true,
      amount: true,
      category: { select: { id: true, name: true, color: true } },
    },
  })

  const months = new Map(monthsInRange(from, to).map((month) => [month, { income: 0, expense: 0 }]))
  const byCategory = new Map<string, Report['spendingByCategory'][number]>()

  for (const row of rows) {
    const amount = Number(row.amount)
    months.get(toDay(row.date).slice(0, 7))![row.type] += amount
    if (row.type === 'expense') {
      const entry = byCategory.get(row.category.id) ?? { category: row.category, amount: 0 }
      entry.amount += amount
      byCategory.set(row.category.id, entry)
    }
  }

  res.json({
    from,
    to,
    months: [...months].map(([month, totals]) => ({ month, ...totals })),
    spendingByCategory: [...byCategory.values()].sort((a, b) => b.amount - a.amount),
  } satisfies Report)
})

// Every transaction in the range as a CSV file, oldest first.
reportsRouter.get('/transactions.csv', async (req, res) => {
  const { from, to } = monthRangeSchema.parse(req.query)
  const user = currentUser(req)
  const divisor = 10 ** currencyFractionDigits(user.currency)

  const rows = await prisma.transaction.findMany({
    where: { userId: user.id, date: monthSpan(from, to) },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    select: { date: true, type: true, amount: true, note: true, category: { select: { name: true } } },
  })

  const csv = toCsv([
    ['Date', 'Type', 'Category', `Amount (${user.currency})`, 'Note'],
    ...rows.map((row) => [
      toDay(row.date),
      row.type,
      row.category.name,
      Number(row.amount) / divisor,
      row.note,
    ]),
  ])

  res
    .type('text/csv; charset=utf-8')
    .attachment(`transactions-${from}-to-${to}.csv`)
    // A byte-order mark so Excel reads the file as UTF-8 (Vietnamese text).
    .send(`\uFEFF${csv}`)
})
