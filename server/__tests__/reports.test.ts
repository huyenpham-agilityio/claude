import { reportSchema } from '@expenses/shared'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { toCsv } from '../src/csv.ts'
import { app, categoryNamed, resetDatabase, signUp } from './helpers.ts'

type Agent = Awaited<ReturnType<typeof signUp>>

async function add(agent: Agent, category: string, amount: number, date: string, note?: string) {
  const { id } = await categoryNamed(agent, category)
  await agent.post('/api/transactions').send({ categoryId: id, amount, date, note }).expect(201)
}

async function summary(agent: Agent, from: string, to: string) {
  const res = await agent.get(`/api/reports/summary?from=${from}&to=${to}`).expect(200)
  return reportSchema.parse(res.body)
}

beforeEach(resetDatabase)

describe('GET /api/reports/summary', () => {
  it('requires a session', async () => {
    expect((await request(app).get('/api/reports/summary?from=2026-01&to=2026-03')).status).toBe(401)
  })

  it('totals each month in the range, including empty ones', async () => {
    const agent = await signUp()
    await add(agent, 'Salary', 30_000_000, '2026-08-01')
    await add(agent, 'Rent', 8_000_000, '2026-08-01')
    await add(agent, 'Groceries', 500_000, '2026-08-31')
    await add(agent, 'Salary', 31_000_000, '2026-10-01')
    await add(agent, 'Rent', 9_999_999, '2026-07-31')
    await add(agent, 'Rent', 9_999_999, '2026-11-01')

    const report = await summary(agent, '2026-08', '2026-10')

    expect(report.months).toEqual([
      { month: '2026-08', income: 30_000_000, expense: 8_500_000 },
      { month: '2026-09', income: 0, expense: 0 },
      { month: '2026-10', income: 31_000_000, expense: 0 },
    ])
  })

  it('crosses a year boundary', async () => {
    const agent = await signUp()
    await add(agent, 'Rent', 100, '2027-01-15')

    const report = await summary(agent, '2026-11', '2027-02')

    expect(report.months.map((month) => month.month)).toEqual([
      '2026-11',
      '2026-12',
      '2027-01',
      '2027-02',
    ])
    expect(report.months[2]!.expense).toBe(100)
  })

  it('ranks expense categories by spending and leaves out income', async () => {
    const agent = await signUp()
    await add(agent, 'Groceries', 300_000, '2026-09-02')
    await add(agent, 'Groceries', 400_000, '2026-10-02')
    await add(agent, 'Rent', 8_000_000, '2026-10-01')
    await add(agent, 'Salary', 30_000_000, '2026-10-01')

    const { spendingByCategory } = await summary(agent, '2026-09', '2026-10')

    expect(spendingByCategory.map(({ category, amount }) => [category.name, amount])).toEqual([
      ['Rent', 8_000_000],
      ['Groceries', 700_000],
    ])
  })

  it.each([
    ['a reversed range', 'from=2026-10&to=2026-09'],
    ['more than 24 months', 'from=2024-01&to=2026-01'],
    ['a malformed month', 'from=2026-1&to=2026-03'],
    ['a missing end', 'from=2026-01'],
  ])('rejects %s', async (_label, query) => {
    const agent = await signUp()
    expect((await agent.get(`/api/reports/summary?${query}`)).status).toBe(400)
  })

  it('accepts exactly 24 months', async () => {
    const agent = await signUp()
    expect((await summary(agent, '2024-11', '2026-10')).months).toHaveLength(24)
  })

  it("never includes another account's data", async () => {
    const mine = await signUp('me@example.com')
    await add(mine, 'Rent', 8_000_000, '2026-10-01')
    const theirs = await signUp('them@example.com')

    const report = await summary(theirs, '2026-10', '2026-10')

    expect(report.months[0]).toEqual({ month: '2026-10', income: 0, expense: 0 })
    expect(report.spendingByCategory).toEqual([])
  })
})

describe('GET /api/reports/transactions.csv', () => {
  it('downloads the range as a CSV file, oldest first', async () => {
    const agent = await signUp()
    await add(agent, 'Rent', 8_000_000, '2026-10-01')
    await add(agent, 'Groceries', 250_000, '2026-09-15', 'Phở, "special" bowl')
    await add(agent, 'Salary', 1, '2026-11-01')

    const res = await agent.get('/api/reports/transactions.csv?from=2026-09&to=2026-10')

    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('text/csv; charset=utf-8')
    expect(res.headers['content-disposition']).toBe(
      'attachment; filename=transactions-2026-09-to-2026-10.csv',
    )
    expect(res.text).toBe(
      '\uFEFF' +
        'Date,Type,Category,Amount (VND),Note\r\n' +
        '2026-09-15,expense,Groceries,250000,"Phở, ""special"" bowl"\r\n' +
        '2026-10-01,expense,Rent,8000000,\r\n',
    )
  })

  it('requires a session and a valid range', async () => {
    const agent = await signUp()
    expect((await request(app).get('/api/reports/transactions.csv?from=2026-09&to=2026-10')).status).toBe(401)
    expect((await agent.get('/api/reports/transactions.csv?from=2026-10&to=2026-09')).status).toBe(400)
  })
})

describe('toCsv', () => {
  it('neutralises text that a spreadsheet would run as a formula', () => {
    expect(toCsv([['=HYPERLINK("x")', '+1', '-2', '@cmd', 'plain', -5]])).toBe(
      `"'=HYPERLINK(""x"")",'+1,'-2,'@cmd,plain,-5\r\n`,
    )
  })

  it('quotes line breaks and leaves empty cells empty', () => {
    expect(toCsv([['a\nb', null]])).toBe('"a\nb",\r\n')
  })
})
