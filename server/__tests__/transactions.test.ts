import { TRANSACTION_PAGE_SIZE, transactionListResponseSchema } from '@expenses/shared'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { prisma } from '../src/db.ts'
import { app, categoryNamed, resetDatabase, signUp } from './helpers.ts'

type Agent = Awaited<ReturnType<typeof signUp>>

async function add(agent: Agent, category: string, amount: number, date: string, note?: string) {
  const { id } = await categoryNamed(agent, category)
  const res = await agent.post('/api/transactions').send({ categoryId: id, amount, date, note })
  expect(res.status).toBe(201)
  return res.body.transaction as { id: string }
}

async function list(agent: Agent, query = '') {
  const res = await agent.get(`/api/transactions${query}`).expect(200)
  return transactionListResponseSchema.parse(res.body)
}

beforeEach(resetDatabase)

describe('creating transactions', () => {
  it('requires a session', async () => {
    expect((await request(app).get('/api/transactions')).status).toBe(401)
  })

  it('takes its type from the category', async () => {
    const agent = await signUp()
    const salary = await categoryNamed(agent, 'Salary')

    const res = await agent
      .post('/api/transactions')
      .send({ categoryId: salary.id, amount: 30_000_000, date: '2026-10-05', note: ' October ' })

    expect(res.status).toBe(201)
    expect(res.body.transaction).toMatchObject({
      type: 'income',
      amount: 30_000_000,
      date: '2026-10-05',
      note: 'October',
      category: { id: salary.id, name: 'Salary' },
    })
  })

  it('stores amounts beyond the 32-bit range exactly', async () => {
    const agent = await signUp()
    await add(agent, 'Rent', 5_000_000_000, '2026-10-01')

    const { transactions, totals } = await list(agent)
    expect(transactions[0]!.amount).toBe(5_000_000_000)
    expect(totals.expense).toBe(5_000_000_000)
  })

  it('treats an empty note as no note', async () => {
    const agent = await signUp()
    await add(agent, 'Rent', 100, '2026-10-01', '   ')

    expect((await list(agent)).transactions[0]!.note).toBeNull()
  })

  it.each([
    ['zero amount', { amount: 0 }],
    ['fractional amount', { amount: 10.5 }],
    ['impossible date', { date: '2026-02-30' }],
    ['missing category', { categoryId: '' }],
  ])('rejects a %s', async (_label, override) => {
    const agent = await signUp()
    const rent = await categoryNamed(agent, 'Rent')

    const res = await agent
      .post('/api/transactions')
      .send({ categoryId: rent.id, amount: 100, date: '2026-10-01', ...override })

    expect(res.status).toBe(400)
  })

  it("rejects another account's category", async () => {
    const mine = await signUp('me@example.com')
    const theirs = await signUp('them@example.com')
    const theirRent = await categoryNamed(theirs, 'Rent')

    const res = await mine
      .post('/api/transactions')
      .send({ categoryId: theirRent.id, amount: 100, date: '2026-10-01' })

    expect(res.status).toBe(400)
    expect(await prisma.transaction.count()).toBe(0)
  })
})

describe('listing transactions', () => {
  async function seed() {
    const agent = await signUp()
    await add(agent, 'Groceries', 200_000, '2026-10-03', 'Weekly market')
    await add(agent, 'Rent', 8_000_000, '2026-10-01')
    await add(agent, 'Salary', 30_000_000, '2026-10-05')
    await add(agent, 'Groceries', 150_000, '2026-09-28', 'Fruit')
    return agent
  }

  it('returns newest first with totals for everything', async () => {
    const result = await list(await seed())

    expect(result.transactions.map((item) => item.date)).toEqual([
      '2026-10-05',
      '2026-10-03',
      '2026-10-01',
      '2026-09-28',
    ])
    expect(result.total).toBe(4)
    expect(result.totals).toEqual({ income: 30_000_000, expense: 8_350_000 })
  })

  it('filters by month, including the first and last day', async () => {
    const agent = await seed()
    await add(agent, 'Transport', 10_000, '2026-10-31')
    await add(agent, 'Transport', 99_000, '2026-11-01')

    const result = await list(agent, '?month=2026-10')

    expect(result.total).toBe(4)
    expect(result.totals).toEqual({ income: 30_000_000, expense: 8_210_000 })
  })

  it('filters by type and by category', async () => {
    const agent = await seed()
    const groceries = await categoryNamed(agent, 'Groceries')

    expect((await list(agent, '?type=income')).total).toBe(1)
    const byCategory = await list(agent, `?categoryId=${groceries.id}`)
    expect(byCategory.total).toBe(2)
    expect(byCategory.totals).toEqual({ income: 0, expense: 350_000 })
  })

  it('searches notes and category names', async () => {
    const agent = await seed()

    expect((await list(agent, '?q=market')).transactions).toHaveLength(1)
    expect((await list(agent, '?q=groc')).transactions).toHaveLength(2)
    expect((await list(agent, '?q=nothing')).total).toBe(0)
  })

  it('pages through long lists', async () => {
    const agent = await signUp()
    const rent = await categoryNamed(agent, 'Rent')
    const user = await prisma.user.findFirstOrThrow()
    await prisma.transaction.createMany({
      data: Array.from({ length: TRANSACTION_PAGE_SIZE + 5 }, () => ({
        userId: user.id,
        categoryId: rent.id,
        type: 'expense' as const,
        amount: 1000,
        date: new Date('2026-10-01T00:00:00Z'),
      })),
    })

    const first = await list(agent)
    const second = await list(agent, '?page=2')

    expect(first.transactions).toHaveLength(TRANSACTION_PAGE_SIZE)
    expect(first.pageCount).toBe(2)
    expect(second.transactions).toHaveLength(5)
    expect(second.totals.expense).toBe((TRANSACTION_PAGE_SIZE + 5) * 1000)
  })

  it('rejects a malformed month', async () => {
    const agent = await signUp()
    expect((await agent.get('/api/transactions?month=2026-13')).status).toBe(400)
  })

  it("never includes another account's transactions", async () => {
    await seed()
    const other = await signUp('them@example.com')

    expect((await list(other)).total).toBe(0)
  })
})

describe('changing transactions', () => {
  it('updates fields and follows the new category type', async () => {
    const agent = await signUp()
    const { id } = await add(agent, 'Rent', 100, '2026-10-01')
    const bonus = await categoryNamed(agent, 'Bonus')

    const res = await agent
      .patch(`/api/transactions/${id}`)
      .send({ categoryId: bonus.id, amount: 250, date: '2026-10-02', note: 'Refund' })

    expect(res.status).toBe(200)
    expect(res.body.transaction).toMatchObject({
      type: 'income',
      amount: 250,
      date: '2026-10-02',
      note: 'Refund',
    })
  })

  it('deletes a transaction', async () => {
    const agent = await signUp()
    const { id } = await add(agent, 'Rent', 100, '2026-10-01')

    expect((await agent.delete(`/api/transactions/${id}`)).status).toBe(200)
    expect((await agent.delete(`/api/transactions/${id}`)).status).toBe(404)
    expect((await list(agent)).total).toBe(0)
  })

  it("cannot change or delete another account's transaction", async () => {
    const mine = await signUp('me@example.com')
    const theirs = await signUp('them@example.com')
    const { id } = await add(mine, 'Rent', 100, '2026-10-01')
    const theirRent = await categoryNamed(theirs, 'Rent')

    const patch = await theirs
      .patch(`/api/transactions/${id}`)
      .send({ categoryId: theirRent.id, amount: 1, date: '2026-10-01' })
    const remove = await theirs.delete(`/api/transactions/${id}`)

    expect(patch.status).toBe(404)
    expect(remove.status).toBe(404)
    expect((await list(mine)).transactions[0]!.amount).toBe(100)
  })
})

describe('quick search', () => {
  it('finds only the signed-in account\'s notes', async () => {
    const mine = await signUp('me@example.com')
    const theirs = await signUp('them@example.com')
    await add(mine, 'Rent', 100, '2026-10-01', 'my market run')
    await add(theirs, 'Rent', 200, '2026-10-02', 'their market run')

    const res = await mine.get('/api/transactions/search').query({ q: 'market' }).expect(200)

    expect(res.body.results).toHaveLength(1)
    expect(res.body.results[0]).toMatchObject({ note: 'my market run', date: '2026-10-01' })
  })

  it('treats the query as text, not as SQL', async () => {
    const mine = await signUp('me@example.com')
    const theirs = await signUp('them@example.com')
    await add(mine, 'Rent', 100, '2026-10-01', 'mine')
    await add(theirs, 'Rent', 200, '2026-10-02', 'theirs')

    const res = await mine.get('/api/transactions/search').query({ q: "' OR '1'='1" }).expect(200)

    expect(res.body.results).toEqual([])
  })
})
