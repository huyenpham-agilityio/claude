import { healthResponseSchema } from '@expenses/shared'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.ts'

const app = createApp()

describe('GET /api/health', () => {
  it('reports the API and database as up', async () => {
    const res = await request(app).get('/api/health')

    expect(res.status).toBe(200)
    expect(healthResponseSchema.parse(res.body)).toEqual({ status: 'ok', db: 'up' })
  })
})

describe('unknown API routes', () => {
  it('returns a JSON 404', async () => {
    const res = await request(app).get('/api/nope')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: { message: 'Not found' } })
  })
})
