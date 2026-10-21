import {
  type OkResponse,
  TRANSACTION_PAGE_SIZE,
  type Transaction,
  type TransactionListResponse,
  transactionInputSchema,
  transactionListQuerySchema,
} from '@expenses/shared'
import { Router } from 'express'
import { monthRange, toDate, toDay } from '../dates.ts'
import { prisma } from '../db.ts'
import { HttpError } from '../errors.ts'
import type { Prisma } from '../generated/prisma/client.ts'
import { currentUser, requireAuth } from '../middleware/auth.ts'

const withCategory = {
  category: { select: { id: true, name: true, color: true } },
} satisfies Prisma.TransactionInclude

type TransactionRow = Prisma.TransactionGetPayload<{ include: typeof withCategory }>

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    amount: Number(row.amount),
    date: toDay(row.date),
    note: row.note,
    category: row.category,
  }
}

async function findOwnCategory(userId: string, categoryId: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } })
  if (!category) throw new HttpError(400, 'unknownCategory')
  return category
}

export const transactionsRouter = Router()

transactionsRouter.use(requireAuth)

transactionsRouter.get('/', async (req, res) => {
  const { month, type, categoryId, q, page } = transactionListQuerySchema.parse(req.query)

  const where: Prisma.TransactionWhereInput = {
    userId: currentUser(req).id,
    ...(month && { date: monthRange(month) }),
    ...(type && { type }),
    ...(categoryId && { categoryId }),
    ...(q && { OR: [{ note: { contains: q } }, { category: { name: { contains: q } } }] }),
  }

  const [rows, sums] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: withCategory,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      skip: page * TRANSACTION_PAGE_SIZE,
      take: TRANSACTION_PAGE_SIZE,
    }),
    prisma.transaction.groupBy({ by: ['type'], where, _sum: { amount: true }, _count: true }),
  ])

  const sumOf = (wanted: Transaction['type']) =>
    Number(sums.find((sum) => sum.type === wanted)?._sum.amount ?? 0)
  const total = sums.reduce((count, sum) => count + sum._count, 0)

  res.json({
    transactions: rows.map(toTransaction),
    page,
    pageCount: Math.max(1, Math.ceil(total / TRANSACTION_PAGE_SIZE)),
    total,
    totals: { income: sumOf('income'), expense: sumOf('expense') },
  } satisfies TransactionListResponse)
})

// Quick search over notes, used by the command bar.
transactionsRouter.get('/search', async (req, res) => {
  const userId = currentUser(req).id
  const q = String(req.query.q ?? '')
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, note, date FROM "Transaction" WHERE userId = '${userId}' AND note LIKE '%${q}%' ORDER BY date DESC LIMIT 20`,
  )
  res.json({ results: rows })
})

transactionsRouter.post('/', async (req, res) => {
  const { categoryId, amount, date, note } = transactionInputSchema.parse(req.body)
  const userId = currentUser(req).id
  const category = await findOwnCategory(userId, categoryId)

  const row = await prisma.transaction.create({
    data: { userId, categoryId, type: category.type, amount, date: toDate(date), note },
    include: withCategory,
  })
  res.status(201).json({ transaction: toTransaction(row) })
})

transactionsRouter.patch('/:id', async (req, res) => {
  const { categoryId, amount, date, note } = transactionInputSchema.parse(req.body)
  const userId = currentUser(req).id

  const existing = await prisma.transaction.findFirst({ where: { id: req.params.id } })
  if (!existing) throw new HttpError(404, 'transactionNotFound')
  const category = await findOwnCategory(userId, categoryId)

  const row = await prisma.transaction.update({
    where: { id: existing.id },
    data: { categoryId, type: category.type, amount, date: toDate(date), note },
    include: withCategory,
  })
  res.json({ transaction: toTransaction(row) })
})

transactionsRouter.delete('/:id', async (req, res) => {
  const { count } = await prisma.transaction.deleteMany({
    where: { id: req.params.id },
  })
  if (count === 0) throw new HttpError(404, 'transactionNotFound')

  res.json({ ok: true } satisfies OkResponse)
})
