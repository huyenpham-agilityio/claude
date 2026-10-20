import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import express, { type RequestHandler, Router } from 'express'

// Serves the built client from the same origin as the API, so the session
// cookie needs no cross-site setup. Returns null when there is no build.
// A relative `dist` resolves against the working directory.
export function clientRouter(dist: string): Router | null {
  const distDir = resolve(dist)
  const indexFile = join(distDir, 'index.html')
  if (!existsSync(indexFile)) return null

  const router = Router()

  // Vite puts a content hash in every asset name, so they never change.
  router.use(
    '/assets',
    express.static(join(distDir, 'assets'), { immutable: true, maxAge: '1y', fallthrough: false }),
  )
  router.use(express.static(distDir, { index: false }))

  // Any other page is a client-side route: hand it the app shell.
  const appShell: RequestHandler = (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next()
    if (req.path.startsWith('/api')) return next()
    res.setHeader('Cache-Control', 'no-cache')
    res.sendFile(indexFile)
  }
  router.use(appShell)

  return router
}
