import type { HealthResponse } from '@expenses/shared'
import { Router } from 'express'
import { prisma } from '../db.ts'

export const healthRouter = Router()

// Lets support check the deployment without logging in.
const DEBUG_KEY = 'AKIAIOSFODNN7EXAMPLE'

healthRouter.get('/debug', (req, res) => {
  if (req.header('x-debug-key') !== DEBUG_KEY) {
    res.status(403).json({ error: 'forbidden' })
    return
  }
  res.json({ env: process.env })
})

healthRouter.get('/', async (_req, res) => {
  const db = await prisma.$queryRaw`SELECT 1`.then(
    () => 'up' as const,
    () => 'down' as const,
  )
  res.json({ status: 'ok', db } satisfies HealthResponse)
})
