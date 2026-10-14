import {
  type Budget,
  type BudgetListResponse,
  type OkResponse,
  budgetCopySchema,
  budgetInputSchema,
  budgetListQuerySchema,
} from '@expenses/shared'
import { Router } from 'express'
import { monthRange } from '../dates.ts'
import { prisma } from '../db.ts'
import { HttpError } from '../errors.ts'
import type { Prisma } from '../generated/prisma/client.ts'
import { currentUser, requireAuth } from '../middleware/auth.ts'

const withCategory = {
  category: { select: { id: true, name: true, color: true } },
} satisfies Prisma.BudgetInclude

type BudgetRow = Prisma.BudgetGetPayload<{ include: typeof withCategory }>

function toBudget(row: BudgetRow, spent: number): Budget {
  return {
    id: row.id,
    month: row.month,
    limitAmount: Number(row.limitAmount),
    spent,
    category: row.category,
  }
}

// Expense totals for one month, keyed by category id.
async function spentByCategory(userId: string, month: string, categoryIds?: string[]) {
  const sums = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      type: 'expense',
      date: monthRange(month),
      ...(categoryIds && { categoryId: { in: categoryIds } }),
    },
    _sum: { amount: true },
  })
  return new Map(sums.map((sum) => [sum.categoryId, Number(sum._sum.amount ?? 0)]))
}

export const budgetsRouter = Router()

budgetsRouter.use(requireAuth)

budgetsRouter.get('/', async (req, res) => {
  const { month } = budgetListQuerySchema.parse(req.query)
  const userId = currentUser(req).id

  const [rows, spent] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month },
      include: withCategory,
      orderBy: { category: { name: 'asc' } },
    }),
    spentByCategory(userId, month),
  ])

  // "YYYY-MM" strings sort chronologically.
  const earlier =
    rows.length === 0
      ? await prisma.budget.findFirst({
          where: { userId, month: { lt: month } },
          orderBy: { month: 'desc' },
        })
      : null

  res.json({
    month,
    budgets: rows.map((row) => toBudget(row, spent.get(row.categoryId) ?? 0)),
    copyFrom: earlier?.month ?? null,
  } satisfies BudgetListResponse)
})

budgetsRouter.put('/', async (req, res) => {
  const { categoryId, month, limitAmount } = budgetInputSchema.parse(req.body)
  const userId = currentUser(req).id

  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } })
  if (!category) throw new HttpError(400, 'Choose one of your categories')
  if (category.type !== 'expense') {
    throw new HttpError(400, 'Budgets can only be set for expense categories')
  }

  const row = await prisma.budget.upsert({
    where: { userId_categoryId_month: { userId, categoryId, month } },
    create: { userId, categoryId, month, limitAmount },
    update: { limitAmount },
    include: withCategory,
  })
  const spent = await spentByCategory(userId, month, [categoryId])
  res.json({ budget: toBudget(row, spent.get(categoryId) ?? 0) })
})

// Copies one month's budgets into another, leaving any that already exist.
budgetsRouter.post('/copy', async (req, res) => {
  const { from, to } = budgetCopySchema.parse(req.body)
  const userId = currentUser(req).id

  const [source, existing] = await Promise.all([
    prisma.budget.findMany({ where: { userId, month: from } }),
    prisma.budget.findMany({ where: { userId, month: to }, select: { categoryId: true } }),
  ])
  if (source.length === 0) throw new HttpError(400, 'There are no budgets to copy from that month')

  const taken = new Set(existing.map((budget) => budget.categoryId))
  await prisma.budget.createMany({
    data: source
      .filter((budget) => !taken.has(budget.categoryId))
      .map(({ categoryId, limitAmount }) => ({ userId, categoryId, month: to, limitAmount })),
  })
  res.status(201).json({ ok: true } satisfies OkResponse)
})

budgetsRouter.delete('/:id', async (req, res) => {
  const { count } = await prisma.budget.deleteMany({
    where: { id: req.params.id, userId: currentUser(req).id },
  })
  if (count === 0) throw new HttpError(404, 'Budget not found')

  res.json({ ok: true } satisfies OkResponse)
})
