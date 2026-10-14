import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { signedInHandlers } from './fixtures.ts'
import { mockApi, renderApp } from './renderApp.tsx'

afterEach(() => vi.unstubAllGlobals())

const ROW_WIDTH = 200
const TAB_WIDTH = 90
const PADDING = 8

// jsdom does no layout, so give the tab row and its tabs fixed geometry: a
// 200px-wide row with 8px padding, and 90px-wide tabs side by side. Tabs
// move on screen as the row scrolls, and scrolling clamps at 0 like a browser.
function fakeLayout(nav: HTMLElement) {
  let scrollLeft = 0
  nav.style.paddingLeft = `${PADDING}px`
  Object.defineProperties(nav, {
    clientWidth: { configurable: true, value: ROW_WIDTH },
    scrollLeft: {
      configurable: true,
      get: () => scrollLeft,
      set: (value: number) => (scrollLeft = Math.max(0, value)),
    },
  })
  nav.getBoundingClientRect = () => ({ left: 0 }) as DOMRect
  nav.querySelectorAll('a').forEach((tab, index) => {
    Object.defineProperty(tab, 'offsetWidth', { configurable: true, value: TAB_WIDTH })
    tab.getBoundingClientRect = () =>
      ({ left: PADDING + index * TAB_WIDTH - scrollLeft }) as DOMRect
  })
  return () => scrollLeft
}

async function renderTabs() {
  mockApi(signedInHandlers())
  renderApp('/')
  const nav = await screen.findByRole('navigation', { name: 'Main' })
  return { nav, scrollLeft: fakeLayout(nav) }
}

describe('section tabs', () => {
  // A real overflow check needs a browser; this guards the setting that
  // prevents the vertical scrollbar.
  it('keeps the tab row sideways-only', async () => {
    const { nav } = await renderTabs()

    expect(nav).toHaveClass('overflow-x-auto', 'overflow-y-hidden')
  })

  it('brings the current tab into view, keeping the row padding visible', async () => {
    const { scrollLeft } = await renderTabs()

    // Categories, the sixth tab, ends at 8 + 6 * 90 = 548px; with 8px
    // padding after it, the row scrolls to 556 - 200.
    await userEvent.click(screen.getByRole('link', { name: 'Categories' }))
    expect(scrollLeft()).toBe(PADDING + 6 * TAB_WIDTH + PADDING - ROW_WIDTH)

    // Overview is now off the left edge; scrolling back reaches the start.
    await userEvent.click(screen.getByRole('link', { name: 'Overview' }))
    expect(scrollLeft()).toBe(0)
  })

  it('leaves the row alone when the current tab is already visible', async () => {
    const { scrollLeft } = await renderTabs()

    // Transactions spans 98-188px, inside the 200px row with its padding.
    await userEvent.click(screen.getByRole('link', { name: 'Transactions' }))

    expect(scrollLeft()).toBe(0)
  })
})
