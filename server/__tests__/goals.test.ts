import { goalListResponseSchema } from '@expenses/shared'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { app, resetDatabase, signUp } from './helpers.ts'

type Agent = Awaited<ReturnType<typeof signUp>>

const trip = { name: 'Trip to Japan', targetAmount: 60_000_000, targetDate: '2027-04-01' }

async function createGoal(agent: Agent, body: object = trip) {
  const res = await agent.post('/api/goals').send(body)
  expect(res.status).toBe(201)
  return res.body.goal as { id: string }
}

async function contribute(agent: Agent, id: string, amount: number) {
  return agent.post(`/api/goals/${id}/contributions`).send({ amount })
}

beforeEach(resetDatabase)

describe('savings goals', () => {
  it('requires a session', async () => {
    expect((await request(app).get('/api/goals')).status).toBe(401)
  })

  it('creates a goal that starts empty', async () => {
    const agent = await signUp()
    await createGoal(agent, { ...trip, name: '  Trip to Japan ' })

    const { goals } = goalListResponseSchema.parse((await agent.get('/api/goals')).body)
    expect(goals).toEqual([
      {
        id: expect.any(String),
        name: 'Trip to Japan',
        targetAmount: 60_000_000,
        savedAmount: 0,
        targetDate: '2027-04-01',
      },
    ])
  })

  it('allows a goal without a target date', async () => {
    const agent = await signUp()
    await createGoal(agent, { ...trip, targetDate: null })

    const { goals } = goalListResponseSchema.parse((await agent.get('/api/goals')).body)
    expect(goals[0]!.targetDate).toBeNull()
  })

  it('rejects invalid input', async () => {
    const agent = await signUp()
    const res = await agent
      .post('/api/goals')
      .send({ name: '', targetAmount: -5, targetDate: '2027-02-30' })

    expect(res.status).toBe(400)
    expect(res.body.error.issues).toHaveLength(3)
  })

  it('edits name, target, and date without touching the saved amount', async () => {
    const agent = await signUp()
    const { id } = await createGoal(agent)
    await contribute(agent, id, 5_000_000)

    const res = await agent
      .patch(`/api/goals/${id}`)
      .send({ name: 'Japan', targetAmount: 70_000_000, targetDate: null })

    expect(res.body.goal).toMatchObject({
      name: 'Japan',
      targetAmount: 70_000_000,
      savedAmount: 5_000_000,
      targetDate: null,
    })
  })

  it('adds and takes out money', async () => {
    const agent = await signUp()
    const { id } = await createGoal(agent)

    expect((await contribute(agent, id, 5_000_000)).body.goal.savedAmount).toBe(5_000_000)
    expect((await contribute(agent, id, 3_000_000)).body.goal.savedAmount).toBe(8_000_000)
    expect((await contribute(agent, id, -2_000_000)).body.goal.savedAmount).toBe(6_000_000)
  })

  it('may be saved past its target', async () => {
    const agent = await signUp()
    const { id } = await createGoal(agent, { ...trip, targetAmount: 1000 })

    expect((await contribute(agent, id, 1500)).body.goal.savedAmount).toBe(1500)
  })

  it('cannot go below zero', async () => {
    const agent = await signUp()
    const { id } = await createGoal(agent)
    await contribute(agent, id, 1000)

    const res = await contribute(agent, id, -1001)

    expect(res.status).toBe(400)
    expect((await contribute(agent, id, -1000)).body.goal.savedAmount).toBe(0)
  })

  it('rejects a zero or fractional contribution', async () => {
    const agent = await signUp()
    const { id } = await createGoal(agent)

    expect((await contribute(agent, id, 0)).status).toBe(400)
    expect((await contribute(agent, id, 1.5)).status).toBe(400)
  })

  it('deletes a goal', async () => {
    const agent = await signUp()
    const { id } = await createGoal(agent)

    expect((await agent.delete(`/api/goals/${id}`)).status).toBe(200)
    expect((await agent.delete(`/api/goals/${id}`)).status).toBe(404)
  })

  it("cannot see or change another account's goals", async () => {
    const mine = await signUp('me@example.com')
    const theirs = await signUp('them@example.com')
    const { id } = await createGoal(mine)

    const goals = goalListResponseSchema.parse((await theirs.get('/api/goals')).body).goals
    expect(goals).toHaveLength(0)
    expect((await theirs.patch(`/api/goals/${id}`).send(trip)).status).toBe(404)
    expect((await contribute(theirs, id, 1000)).status).toBe(404)
    expect((await theirs.delete(`/api/goals/${id}`)).status).toBe(404)
  })
})
