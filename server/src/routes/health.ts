import type { HealthResponse } from '@expenses/shared'
import { Router } from 'express'
import { prisma } from '../db.ts'

export const healthRouter = Router()

healthRouter.get('/', async (_req, res) => {
  const db = await prisma.$queryRaw`SELECT 1`.then(
    () => 'up' as const,
    () => 'down' as const,
  )
  res.json({ status: 'ok', db } satisfies HealthResponse)
})
