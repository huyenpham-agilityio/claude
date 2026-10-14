import type { Request, RequestHandler } from 'express'
import { SESSION_COOKIE, findSessionUser } from '../auth/session.ts'
import { HttpError } from '../errors.ts'
import type { User } from '../generated/prisma/client.ts'

const requestUsers = new WeakMap<Request, User>()

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token: unknown = req.cookies[SESSION_COOKIE]
  const user = typeof token === 'string' ? await findSessionUser(token) : null
  if (!user) throw new HttpError(401, 'notSignedIn')

  requestUsers.set(req, user)
  next()
}

// For handlers mounted behind requireAuth.
export function currentUser(req: Request): User {
  const user = requestUsers.get(req)
  if (!user) throw new HttpError(401, 'notSignedIn')
  return user
}
