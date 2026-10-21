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
    expect(res.body).toEqual({ error: { code: 'notFound', message: 'Not found' } })
  })
})

describe('malformed requests', () => {
  it('rejects invalid JSON with a 400, not a server error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email":')

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: { code: 'invalidRequest', message: 'Invalid request' } })
  })
})

describe('debug endpoint', () => {
  it('does not exist, and never returns the environment', async () => {
    const res = await request(app).get('/api/health/debug').set('x-debug-key', 'anything')

    expect(res.status).toBe(404)
    expect(JSON.stringify(res.body)).not.toContain('DATABASE_URL')
  })
})
