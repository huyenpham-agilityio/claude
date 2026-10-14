import { budgetListResponseSchema, budgetStatus } from '@expenses/shared'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app, categoryNamed, resetDatabase, signUp } from './helpers.ts'

type Agent = Awaited<ReturnType<typeof signUp>>

async function setBudget(agent: Agent, category: string, month: string, limitAmount: number) {
  const { id } = await categoryNamed(agent, category)
  return agent.put('/api/budgets').send({ categoryId: id, month, limitAmount })
}

async function spend(agent: Agent, category: string, amount: number, date: string) {
  const { id } = await categoryNamed(agent, category)
  await agent.post('/api/transactions').send({ categoryId: id, amount, date }).expect(201)
}

async function list(agent: Agent, month: string) {
  const res = await agent.get(`/api/budgets?month=${month}`).expect(200)
  return budgetListResponseSchema.parse(res.body)
}

beforeEach(resetDatabase)

describe('budgetStatus', () => {
  it.each([
    [0, 'ok'],
    [79, 'ok'],
    [80, 'warning'],
    [100, 'warning'],
    [101, 'over'],
  ] as const)('%i of 100 spent is %s', (spent, expected) => {
    expect(budgetStatus(spent, 100)).toBe(expected)
  })
})

describe('budgets', () => {
  it('requires a session and a month', async () => {
    expect((await request(app).get('/api/budgets?month=2026-10')).status).toBe(401)
    expect((await (await signUp()).get('/api/budgets')).status).toBe(400)
  })

  it('reports what was spent in the category that month', async () => {
    const agent = await signUp()
    await setBudget(agent, 'Groceries', '2026-10', 2_000_000)
    await spend(agent, 'Groceries', 300_000, '2026-10-01')
    await spend(agent, 'Groceries', 500_000, '2026-10-31')
    await spend(agent, 'Groceries', 999_000, '2026-09-30')
    await spend(agent, 'Groceries', 999_000, '2026-11-01')
    await spend(agent, 'Rent', 8_000_000, '2026-10-01')

    const { budgets } = await list(agent, '2026-10')

    expect(budgets).toHaveLength(1)
    expect(budgets[0]).toMatchObject({
      limitAmount: 2_000_000,
      spent: 800_000,
      category: { name: 'Groceries' },
    })
  })

  it('returns the spent amount when saving', async () => {
    const agent = await signUp()
    await spend(agent, 'Groceries', 300_000, '2026-10-01')

    const res = await setBudget(agent, 'Groceries', '2026-10', 2_000_000)

    expect(res.status).toBe(200)
    expect(res.body.budget).toMatchObject({ spent: 300_000, limitAmount: 2_000_000 })
  })

  it('replaces the limit when saved again for the same category and month', async () => {
    const agent = await signUp()
    await setBudget(agent, 'Groceries', '2026-10', 2_000_000)
    await setBudget(agent, 'Groceries', '2026-10', 2_500_000)
    await setBudget(agent, 'Groceries', '2026-11', 3_000_000)

    expect((await list(agent, '2026-10')).budgets.map((budget) => budget.limitAmount)).toEqual([
      2_500_000,
    ])
    expect((await list(agent, '2026-11')).budgets[0]!.limitAmount).toBe(3_000_000)
  })

  it('refuses income categories, foreign categories, and bad input', async () => {
    const mine = await signUp('me@example.com')
    const theirs = await signUp('them@example.com')
    const theirRent = await categoryNamed(theirs, 'Rent')

    const income = await setBudget(mine, 'Salary', '2026-10', 1000)
    const foreign = await mine
      .put('/api/budgets')
      .send({ categoryId: theirRent.id, month: '2026-10', limitAmount: 1000 })
    const zero = await setBudget(mine, 'Rent', '2026-10', 0)
    const badMonth = await setBudget(mine, 'Rent', '2026-13', 1000)

    expect([income.status, foreign.status, zero.status, badMonth.status]).toEqual([
      400, 400, 400, 400,
    ])
    expect((await list(mine, '2026-10')).budgets).toHaveLength(0)
  })

  it('deletes a budget', async () => {
    const agent = await signUp()
    const { body } = await setBudget(agent, 'Rent', '2026-10', 8_000_000)

    expect((await agent.delete(`/api/budgets/${body.budget.id}`)).status).toBe(200)
    expect((await agent.delete(`/api/budgets/${body.budget.id}`)).status).toBe(404)
    expect((await list(agent, '2026-10')).budgets).toHaveLength(0)
  })

  it("keeps accounts' budgets separate", async () => {
    const mine = await signUp('me@example.com')
    const theirs = await signUp('them@example.com')
    const { body } = await setBudget(mine, 'Rent', '2026-10', 8_000_000)

    expect((await list(theirs, '2026-10')).budgets).toHaveLength(0)
    expect((await theirs.delete(`/api/budgets/${body.budget.id}`)).status).toBe(404)
  })

  it('goes away with its category', async () => {
    const agent = await signUp()
    await setBudget(agent, 'Rent', '2026-10', 8_000_000)
    const rent = await categoryNamed(agent, 'Rent')

    await agent.delete(`/api/categories/${rent.id}`).expect(200)

    expect((await list(agent, '2026-10')).budgets).toHaveLength(0)
  })
})

describe('copying budgets', () => {
  it('offers the latest earlier month only when this month is empty', async () => {
    const agent = await signUp()
    await setBudget(agent, 'Rent', '2026-07', 7_000_000)
    await setBudget(agent, 'Rent', '2026-09', 8_000_000)
    await setBudget(agent, 'Rent', '2026-12', 9_000_000)

    expect((await list(agent, '2026-10')).copyFrom).toBe('2026-09')
    expect((await list(agent, '2026-09')).copyFrom).toBeNull()
    expect((await list(agent, '2026-06')).copyFrom).toBeNull()
  })

  it('copies limits without overwriting ones already set', async () => {
    const agent = await signUp()
    await setBudget(agent, 'Rent', '2026-09', 8_000_000)
    await setBudget(agent, 'Groceries', '2026-09', 2_000_000)
    await setBudget(agent, 'Groceries', '2026-10', 2_500_000)

    const res = await agent.post('/api/budgets/copy').send({ from: '2026-09', to: '2026-10' })

    expect(res.status).toBe(201)
    const october = (await list(agent, '2026-10')).budgets
    expect(october.map((budget) => [budget.category.name, budget.limitAmount])).toEqual([
      ['Groceries', 2_500_000],
      ['Rent', 8_000_000],
    ])
    expect((await list(agent, '2026-09')).budgets).toHaveLength(2)
  })

  it('refuses to copy from a month with no budgets', async () => {
    const agent = await signUp()
    const res = await agent.post('/api/budgets/copy').send({ from: '2026-09', to: '2026-10' })

    expect(res.status).toBe(400)
  })
})
