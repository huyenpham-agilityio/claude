import {
  type Goal,
  type GoalListResponse,
  type OkResponse,
  goalContributionSchema,
  goalInputSchema,
} from '@expenses/shared'
import { Router } from 'express'
import { toDate, toDay } from '../dates.ts'
import { prisma } from '../db.ts'
import { HttpError } from '../errors.ts'
import type { SavingsGoal } from '../generated/prisma/client.ts'
import { currentUser, requireAuth } from '../middleware/auth.ts'

function toGoal(row: SavingsGoal): Goal {
  return {
    id: row.id,
    name: row.name,
    targetAmount: Number(row.targetAmount),
    savedAmount: Number(row.savedAmount),
    targetDate: row.targetDate && toDay(row.targetDate),
  }
}

async function findOwnGoal(userId: string, id: string) {
  const goal = await prisma.savingsGoal.findFirst({ where: { id, userId } })
  if (!goal) throw new HttpError(404, 'goalNotFound')
  return goal
}

export const goalsRouter = Router()

goalsRouter.use(requireAuth)

goalsRouter.get('/', async (req, res) => {
  const rows = await prisma.savingsGoal.findMany({
    where: { userId: currentUser(req).id },
    orderBy: { createdAt: 'asc' },
  })
  res.json({ goals: rows.map(toGoal) } satisfies GoalListResponse)
})

goalsRouter.post('/', async (req, res) => {
  const { name, targetAmount, targetDate } = goalInputSchema.parse(req.body)

  const row = await prisma.savingsGoal.create({
    data: {
      userId: currentUser(req).id,
      name,
      targetAmount,
      targetDate: targetDate && toDate(targetDate),
    },
  })
  res.status(201).json({ goal: toGoal(row) })
})

goalsRouter.patch('/:id', async (req, res) => {
  const { name, targetAmount, targetDate } = goalInputSchema.parse(req.body)
  const goal = await findOwnGoal(currentUser(req).id, req.params.id)

  const row = await prisma.savingsGoal.update({
    where: { id: goal.id },
    data: { name, targetAmount, targetDate: targetDate && toDate(targetDate) },
  })
  res.json({ goal: toGoal(row) })
})

goalsRouter.post('/:id/contributions', async (req, res) => {
  const { amount } = goalContributionSchema.parse(req.body)
  const userId = currentUser(req).id
  const goal = await findOwnGoal(userId, req.params.id)

  // The balance check is part of the update, so two quick withdrawals cannot
  // both pass it and leave the goal below zero.
  const { count } = await prisma.savingsGoal.updateMany({
    where: { id: goal.id, userId, savedAmount: { gte: -amount } },
    data: { savedAmount: { increment: amount } },
  })
  if (count === 0) throw new HttpError(400, 'withdrawTooMuch')

  const row = await prisma.savingsGoal.findUniqueOrThrow({ where: { id: goal.id } })
  res.json({ goal: toGoal(row) })
})

goalsRouter.delete('/:id', async (req, res) => {
  const { count } = await prisma.savingsGoal.deleteMany({
    where: { id: req.params.id, userId: currentUser(req).id },
  })
  if (count === 0) throw new HttpError(404, 'goalNotFound')

  res.json({ ok: true } satisfies OkResponse)
})
