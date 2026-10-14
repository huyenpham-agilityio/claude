import {
  type Category,
  type CategoryListResponse,
  type OkResponse,
  categoryCreateSchema,
  categoryUpdateSchema,
} from '@expenses/shared'
import { Router } from 'express'
import { prisma } from '../db.ts'
import { HttpError } from '../errors.ts'
import { Prisma } from '../generated/prisma/client.ts'
import { currentUser, requireAuth } from '../middleware/auth.ts'

const withCount = { _count: { select: { transactions: true } } } satisfies Prisma.CategoryInclude

type CategoryRow = Prisma.CategoryGetPayload<{ include: typeof withCount }>

function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    color: row.color,
    transactionCount: row._count.transactions,
  }
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
}

const duplicateName = () => new HttpError(409, 'You already have a category with this name')

export const categoriesRouter = Router()

categoriesRouter.use(requireAuth)

categoriesRouter.get('/', async (req, res) => {
  const rows = await prisma.category.findMany({
    where: { userId: currentUser(req).id },
    include: withCount,
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })
  res.json({ categories: rows.map(toCategory) } satisfies CategoryListResponse)
})

categoriesRouter.post('/', async (req, res) => {
  const data = categoryCreateSchema.parse(req.body)

  const row = await prisma.category
    .create({ data: { ...data, userId: currentUser(req).id }, include: withCount })
    .catch((error: unknown) => {
      throw isUniqueViolation(error) ? duplicateName() : error
    })
  res.status(201).json({ category: toCategory(row) })
})

categoriesRouter.patch('/:id', async (req, res) => {
  const data = categoryUpdateSchema.parse(req.body)
  const where = { id: req.params.id, userId: currentUser(req).id }

  if (!(await prisma.category.findFirst({ where }))) throw new HttpError(404, 'Category not found')

  const row = await prisma.category
    .update({ where: { id: where.id }, data, include: withCount })
    .catch((error: unknown) => {
      throw isUniqueViolation(error) ? duplicateName() : error
    })
  res.json({ category: toCategory(row) })
})

categoriesRouter.delete('/:id', async (req, res) => {
  const row = await prisma.category.findFirst({
    where: { id: req.params.id, userId: currentUser(req).id },
    include: withCount,
  })
  if (!row) throw new HttpError(404, 'Category not found')
  if (row._count.transactions > 0) {
    throw new HttpError(409, 'This category still has transactions. Move or delete them first.')
  }

  await prisma.category.delete({ where: { id: row.id } })
  res.json({ ok: true } satisfies OkResponse)
})
