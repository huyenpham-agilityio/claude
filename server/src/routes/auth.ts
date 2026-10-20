import {
  type ApiError,
  type AuthResponse,
  type OkResponse,
  apiErrorMessages,
  loginInputSchema,
  registerInputSchema,
} from '@expenses/shared'
import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { hashPassword, verifyPassword } from '../auth/password.ts'
import {
  SESSION_COOKIE,
  createSession,
  deleteExpiredSessions,
  deleteSession,
  sessionCookieOptions,
} from '../auth/session.ts'
import { DEFAULT_CATEGORIES } from '../categories/defaults.ts'
import { prisma } from '../db.ts'
import { env } from '../env.ts'
import { HttpError } from '../errors.ts'
import type { User } from '../generated/prisma/client.ts'
import { currentUser, requireAuth } from '../middleware/auth.ts'

export interface AuthRouterOptions {
  registrationOpen: boolean
}

// Verified against when the email is unknown, so a missing account takes as
// long to reject as a wrong password.
const dummyHash = await hashPassword('not-a-real-password')

const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    error: { code: 'tooManyAttempts', message: apiErrorMessages.tooManyAttempts },
  } satisfies ApiError,
})

function toAuthResponse(user: User): AuthResponse {
  return { user: { id: user.id, email: user.email, currency: user.currency } }
}

export function createAuthRouter({ registrationOpen }: AuthRouterOptions) {
  const router = Router()

  router.post('/register', credentialsLimiter, async (req, res) => {
    if (!registrationOpen) throw new HttpError(403, 'registrationClosed')

    const { email, password, locale } = registerInputSchema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) throw new HttpError(409, 'emailTaken')

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        categories: { create: DEFAULT_CATEGORIES[locale] },
      },
    })

    res.cookie(SESSION_COOKIE, await createSession(user.id), sessionCookieOptions)
    res.status(201).json(toAuthResponse(user))
  })

  router.post('/login', credentialsLimiter, async (req, res) => {
    const { email, password } = loginInputSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })
    const valid = await verifyPassword(password, user?.passwordHash ?? dummyHash)
    if (!user || !valid) throw new HttpError(401, 'invalidCredentials')

    await deleteExpiredSessions(user.id)
    res.cookie(SESSION_COOKIE, await createSession(user.id), sessionCookieOptions)
    res.json(toAuthResponse(user))
  })

  router.post('/logout', async (req, res) => {
    const token: unknown = req.cookies[SESSION_COOKIE]
    if (typeof token === 'string') await deleteSession(token)

    const { maxAge: _maxAge, ...clearOptions } = sessionCookieOptions
    res.clearCookie(SESSION_COOKIE, clearOptions)
    res.json({ ok: true } satisfies OkResponse)
  })

  router.get('/me', requireAuth, (req, res) => {
    res.json(toAuthResponse(currentUser(req)))
  })

  return router
}
