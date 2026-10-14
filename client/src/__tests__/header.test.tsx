import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { signedInHandlers } from './fixtures.ts'
import { mockApi, renderApp } from './renderApp.tsx'

afterEach(() => vi.unstubAllGlobals())

// jsdom does no layout, so give the tab row and its tabs fixed geometry: a
// 200px-wide row and 100px-wide tabs placed side by side.
function fakeLayout(nav: HTMLElement) {
  let scrollLeft = 0
  Object.defineProperties(nav, {
    offsetLeft: { configurable: true, value: 0 },
    clientWidth: { configurable: true, value: 200 },
    scrollLeft: {
      configurable: true,
      get: () => scrollLeft,
      set: (value: number) => (scrollLeft = value),
    },
  })
  nav.querySelectorAll('a').forEach((tab, index) => {
    Object.defineProperties(tab, {
      offsetLeft: { configurable: true, value: index * 100 },
      offsetWidth: { configurable: true, value: 100 },
    })
  })
  return () => scrollLeft
}

describe('section tabs', () => {
  it('scroll sideways only, so the row never shows a vertical scrollbar', async () => {
    mockApi(signedInHandlers())
    renderApp('/')

    const nav = await screen.findByRole('navigation', { name: 'Main' })
    expect(nav).toHaveClass('overflow-x-auto', 'overflow-y-hidden')
  })

  it('bring the current tab into view when it is off-screen, and back again', async () => {
    mockApi(signedInHandlers())
    renderApp('/')
    const nav = await screen.findByRole('navigation', { name: 'Main' })
    const scrollLeft = fakeLayout(nav)

    // Categories is the sixth tab: 500-600px, past the 200px-wide row.
    await userEvent.click(screen.getByRole('link', { name: 'Categories' }))
    expect(scrollLeft()).toBe(400)

    // Overview, the first tab, is now off the left edge.
    await userEvent.click(screen.getByRole('link', { name: 'Overview' }))
    expect(scrollLeft()).toBe(0)
  })

  it('leave the row alone when the current tab is already visible', async () => {
    mockApi(signedInHandlers())
    renderApp('/')
    const nav = await screen.findByRole('navigation', { name: 'Main' })
    const scrollLeft = fakeLayout(nav)

    await userEvent.click(screen.getByRole('link', { name: 'Transactions' }))

    expect(scrollLeft()).toBe(0)
  })
})
