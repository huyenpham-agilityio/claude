import { authResponseSchema } from '@expenses/shared'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.ts'
import { prisma } from '../src/db.ts'

const app = createApp({ registrationOpen: true })
const credentials = { email: 'me@example.com', password: 'correct-horse' }

beforeEach(async () => {
  await prisma.user.deleteMany()
})

describe('POST /api/auth/register', () => {
  it('creates the account and signs in', async () => {
    const agent = request.agent(app)
    const res = await agent.post('/api/auth/register').send(credentials)

    expect(res.status).toBe(201)
    expect(authResponseSchema.parse(res.body).user).toMatchObject({
      email: 'me@example.com',
      currency: 'VND',
    })
    expect(res.headers['set-cookie']?.[0]).toMatch(/^sid=.+; .*HttpOnly/)

    const me = await agent.get('/api/auth/me')
    expect(me.status).toBe(200)
    expect(me.body.user.email).toBe('me@example.com')
  })

  it('never stores or returns the password', async () => {
    const res = await request(app).post('/api/auth/register').send(credentials)
    const stored = await prisma.user.findUniqueOrThrow({ where: { email: credentials.email } })

    expect(JSON.stringify(res.body)).not.toContain('correct-horse')
    expect(res.body.user).not.toHaveProperty('passwordHash')
    expect(stored.passwordHash).not.toContain('correct-horse')
  })

  it('normalises the email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, email: '  Me@Example.COM ' })

    expect(res.body.user.email).toBe('me@example.com')
  })

  it('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/register').send(credentials)
    const res = await request(app).post('/api/auth/register').send(credentials)

    expect(res.status).toBe(409)
    expect(res.body.error).toEqual({
      code: 'emailTaken',
      message: 'An account with this email already exists',
    })
  })

  it('rejects invalid input with field issues', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'nope', password: 'short' })

    expect(res.status).toBe(400)
    expect(res.body.error.issues.map((issue: { path: string }) => issue.path)).toEqual([
      'email',
      'password',
    ])
  })

  it('names each invalid field with a translatable code and English text', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'me@example.com', password: 'short' })

    expect(res.body.error).toEqual({
      code: 'invalidRequest',
      message: 'Invalid request',
      issues: [
        {
          path: 'password',
          code: 'passwordTooShort',
          message: 'Password must be at least 8 characters',
        },
      ],
    })
  })

  it('creates default categories in English unless another language is chosen', async () => {
    const english = request.agent(app)
    await english.post('/api/auth/register').send(credentials).expect(201)
    const vietnamese = request.agent(app)
    await vietnamese
      .post('/api/auth/register')
      .send({ email: 'vi@example.com', password: 'correct-horse', locale: 'vi' })
      .expect(201)

    const names = async (agent: typeof english) =>
      ((await agent.get('/api/categories')).body.categories as { name: string }[]).map(
        (category) => category.name,
      )
    expect(await names(english)).toContain('Groceries')
    const vietnameseNames = await names(vietnamese)
    expect(vietnameseNames).toHaveLength(12)
    expect(vietnameseNames).toEqual(expect.arrayContaining(['Đi chợ', 'Tiền nhà', 'Lương']))
    expect(vietnameseNames).not.toContain('Groceries')
  })

  it('rejects an unsupported language', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...credentials, locale: 'fr' })

    expect(res.status).toBe(400)
    expect(await prisma.user.count()).toBe(0)
  })

  it('is refused when registration is closed', async () => {
    const closed = createApp({ registrationOpen: false })
    const res = await request(closed).post('/api/auth/register').send(credentials)

    expect(res.status).toBe(403)
    expect(await prisma.user.count()).toBe(0)
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(credentials)
  })

  it('signs in with the right password', async () => {
    const agent = request.agent(app)
    const res = await agent.post('/api/auth/login').send(credentials)

    expect(res.status).toBe(200)
    expect((await agent.get('/api/auth/me')).status).toBe(200)
  })

  it('gives the same error for a wrong password and an unknown email', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, password: 'wrong-password' })
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ ...credentials, email: 'nobody@example.com' })

    expect(wrongPassword.status).toBe(401)
    expect(unknownEmail.status).toBe(401)
    expect(wrongPassword.body).toEqual(unknownEmail.body)
    expect(wrongPassword.body.error.code).toBe('invalidCredentials')
    expect(wrongPassword.headers['set-cookie']).toBeUndefined()
  })
})

describe('POST /api/auth/logout', () => {
  it('ends the session so the old cookie stops working', async () => {
    const agent = request.agent(app)
    const registered = await agent.post('/api/auth/register').send(credentials)
    const cookie = registered.headers['set-cookie']![0]!.split(';')[0]!

    const res = await agent.post('/api/auth/logout')

    expect(res.status).toBe(200)
    expect((await agent.get('/api/auth/me')).status).toBe(401)
    expect((await request(app).get('/api/auth/me').set('Cookie', cookie)).status).toBe(401)
  })
})

describe('GET /api/auth/me', () => {
  it('requires a session', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401)
  })

  it('rejects an unknown session token', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'sid=made-up')

    expect(res.status).toBe(401)
  })

  it('rejects an expired session', async () => {
    const agent = request.agent(app)
    await agent.post('/api/auth/register').send(credentials)
    await prisma.session.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } })

    expect((await agent.get('/api/auth/me')).status).toBe(401)
    expect(await prisma.session.count()).toBe(0)
  })
})
