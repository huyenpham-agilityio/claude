import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.ts'

const dist = mkdtempSync(join(tmpdir(), 'client-dist-'))
mkdirSync(join(dist, 'assets'))
writeFileSync(join(dist, 'index.html'), '<!doctype html><title>App</title>')
writeFileSync(join(dist, 'assets', 'index-abc123.js'), 'console.log(1)')
writeFileSync(join(dist, 'favicon.svg'), '<svg/>')

afterAll(() => rmSync(dist, { recursive: true, force: true }))

const app = createApp({ clientDist: dist })

describe('serving the built client', () => {
  it('serves the app shell for client-side routes', async () => {
    for (const path of ['/', '/transactions', '/budgets?month=2026-10']) {
      const res = await request(app).get(path)
      expect(res.status).toBe(200)
      expect(res.text).toContain('<title>App</title>')
      expect(res.headers['cache-control']).toBe('no-cache')
    }
  })

  it('caches hashed assets for good', async () => {
    const res = await request(app).get('/assets/index-abc123.js')

    expect(res.status).toBe(200)
    expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable')
  })

  it('serves other public files', async () => {
    expect((await request(app).get('/favicon.svg')).status).toBe(200)
  })

  it('404s a missing asset instead of returning the app shell', async () => {
    expect((await request(app).get('/assets/missing.js')).status).toBe(404)
  })

  it('keeps unknown API routes as JSON 404s', async () => {
    const res = await request(app).get('/api/nope')

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: { message: 'Not found' } })
  })

  it('still answers the API', async () => {
    expect((await request(app).get('/api/health')).body.status).toBe('ok')
  })
})

describe('without a client build', () => {
  it('serves only the API', async () => {
    const apiOnly = createApp({ clientDist: join(dist, 'nope') })

    expect((await request(apiOnly).get('/transactions')).status).toBe(404)
  })
})
