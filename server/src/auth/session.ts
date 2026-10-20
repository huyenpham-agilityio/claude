import { createHash, randomBytes } from 'node:crypto'
import type { CookieOptions } from 'express'
import { prisma } from '../db.ts'
import { env } from '../env.ts'

export const SESSION_COOKIE = 'sid'

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_TTL_MS,
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// Returns the raw token for the cookie; only its hash is stored.
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('base64url')
  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    },
  })
  return token
}

export async function findSessionUser(token: string) {
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  })
  if (!session) return null

  if (session.expiresAt <= new Date()) {
    await prisma.session.deleteMany({ where: { id: session.id } })
    return null
  }
  return session.user
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } })
}

export async function deleteExpiredSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId, expiresAt: { lte: new Date() } } })
}
