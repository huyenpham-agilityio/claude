import type { Category } from '@expenses/shared'
import request from 'supertest'
import { createApp } from '../src/app.ts'
import { prisma } from '../src/db.ts'

export const app = createApp({ registrationOpen: true })

export async function resetDatabase() {
  await prisma.user.deleteMany()
}

// Registers an account and returns an agent that carries its session cookie.
export async function signUp(email = 'me@example.com') {
  const agent = request.agent(app)
  await agent.post('/api/auth/register').send({ email, password: 'correct-horse' }).expect(201)
  return agent
}

export async function categoryNamed(agent: Awaited<ReturnType<typeof signUp>>, name: string) {
  const res = await agent.get('/api/categories').expect(200)
  const category = (res.body.categories as Category[]).find((item) => item.name === name)
  if (!category) throw new Error(`No category named ${name}`)
  return category
}
