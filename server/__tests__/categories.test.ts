import { categoryListResponseSchema } from '@expenses/shared'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app, categoryNamed, resetDatabase, signUp } from './helpers.ts'

beforeEach(resetDatabase)

describe('categories', () => {
  it('requires a session', async () => {
    const res = await request(app).get('/api/categories')

    expect(res.status).toBe(401)
    expect(res.body.error).toEqual({ code: 'notSignedIn', message: 'Not signed in' })
  })

  it('gives a new account the default categories', async () => {
    const agent = await signUp()
    const res = await agent.get('/api/categories')

    const { categories } = categoryListResponseSchema.parse(res.body)
    expect(categories).toHaveLength(12)
    expect(categories.filter((category) => category.type === 'income')).toHaveLength(3)
    expect(categories.every((category) => category.transactionCount === 0)).toBe(true)
  })

  it('creates, renames, and deletes a category', async () => {
    const agent = await signUp()

    const created = await agent
      .post('/api/categories')
      .send({ name: '  Pets ', type: 'expense', color: '#ef4444' })
    expect(created.status).toBe(201)
    expect(created.body.category).toMatchObject({ name: 'Pets', type: 'expense' })

    const id = created.body.category.id as string
    const renamed = await agent.patch(`/api/categories/${id}`).send({ name: 'Pet care', color: '#22c55e' })
    expect(renamed.body.category).toMatchObject({ name: 'Pet care', color: '#22c55e' })

    expect((await agent.delete(`/api/categories/${id}`)).status).toBe(200)
    await expect(categoryNamed(agent, 'Pet care')).rejects.toThrow()
  })

  it('rejects a duplicate name within the same type', async () => {
    const agent = await signUp()
    const body = { name: 'Groceries', color: '#ef4444' }

    expect((await agent.post('/api/categories').send({ ...body, type: 'expense' })).status).toBe(409)
    expect((await agent.post('/api/categories').send({ ...body, type: 'income' })).status).toBe(201)

    const rent = await categoryNamed(agent, 'Rent')
    expect((await agent.patch(`/api/categories/${rent.id}`).send(body)).status).toBe(409)
  })

  it('rejects invalid input', async () => {
    const agent = await signUp()
    const res = await agent.post('/api/categories').send({ name: '', type: 'gift', color: 'red' })

    expect(res.status).toBe(400)
    expect(res.body.error.issues).toHaveLength(3)
  })

  it('refuses to delete a category that has transactions', async () => {
    const agent = await signUp()
    const groceries = await categoryNamed(agent, 'Groceries')
    await agent
      .post('/api/transactions')
      .send({ categoryId: groceries.id, amount: 50_000, date: '2026-10-01' })
      .expect(201)

    const res = await agent.delete(`/api/categories/${groceries.id}`)

    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('categoryInUse')
    expect((await categoryNamed(agent, 'Groceries')).transactionCount).toBe(1)
  })

  it("cannot see or change another account's categories", async () => {
    const mine = await signUp('me@example.com')
    const theirs = await signUp('them@example.com')
    const rent = await categoryNamed(mine, 'Rent')

    const patch = await theirs.patch(`/api/categories/${rent.id}`).send({ name: 'Hacked', color: '#000000' })
    const remove = await theirs.delete(`/api/categories/${rent.id}`)

    expect(patch.status).toBe(404)
    expect(remove.status).toBe(404)
    expect((await categoryNamed(mine, 'Rent')).name).toBe('Rent')
  })
})
