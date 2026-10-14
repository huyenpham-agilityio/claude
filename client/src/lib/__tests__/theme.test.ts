import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import indexHtml from '../../../index.html?raw'
import {
  DARK_QUERY,
  STORAGE_KEY,
  THEME_COLORS,
  readPreference,
  resolveTheme,
  setThemePreference,
  useTheme,
} from '../theme.ts'

const root = document.documentElement

// A matchMedia stand-in whose "change" listeners the test can fire.
function fakeSystem(dark: boolean) {
  const listeners = new Set<() => void>()
  const system = {
    dark,
    listeners,
    change(next: boolean) {
      system.dark = next
      for (const listener of listeners) listener()
    },
  }
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) =>
      ({
        get matches() {
          return query === DARK_QUERY && system.dark
        },
        media: query,
        addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
      }) as unknown as MediaQueryList,
  )
  return system
}

function themeColor() {
  return document.querySelector('meta[name="theme-color"]')?.getAttribute('content')
}

beforeEach(() => {
  localStorage.clear()
  root.classList.remove('dark')
  root.style.colorScheme = ''
  document.head.innerHTML = '<meta name="theme-color" content="#ffffff">'
})

afterEach(() => vi.restoreAllMocks())

describe('resolveTheme', () => {
  it('follows the system when set to system', () => {
    const system = fakeSystem(true)
    expect(resolveTheme('system')).toBe('dark')

    system.change(false)
    expect(resolveTheme('system')).toBe('light')
  })

  it('ignores the system once a theme is chosen', () => {
    fakeSystem(true)
    expect(resolveTheme('light')).toBe('light')
  })
})

describe('readPreference', () => {
  it('defaults to system', () => {
    expect(readPreference()).toBe('system')
  })

  it('reads a saved choice and ignores junk', () => {
    localStorage.setItem(STORAGE_KEY, 'dark')
    expect(readPreference()).toBe('dark')

    localStorage.setItem(STORAGE_KEY, 'purple')
    expect(readPreference()).toBe('system')
  })

  it('falls back to system when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readPreference()).toBe('system')
  })
})

describe('the theme store', () => {
  it('follows the system while set to system, and stops once a theme is chosen', () => {
    const system = fakeSystem(false)
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')

    act(() => system.change(true))
    expect(result.current).toMatchObject({ preference: 'system', theme: 'dark' })
    expect(root).toHaveClass('dark')

    act(() => setThemePreference('light'))
    act(() => system.change(true))
    expect(result.current.theme).toBe('light')
    expect(root).not.toHaveClass('dark')
  })

  it('removes its system listener when nothing uses it', () => {
    const system = fakeSystem(false)
    const { unmount } = renderHook(() => useTheme())
    expect(system.listeners.size).toBe(1)

    unmount()
    expect(system.listeners.size).toBe(0)
  })

  it('keeps every component in step', () => {
    fakeSystem(false)
    const first = renderHook(() => useTheme())
    const second = renderHook(() => useTheme())

    act(() => first.result.current.setPreference('dark'))

    expect(second.result.current).toMatchObject({ preference: 'dark', theme: 'dark' })
  })

  it('picks up a choice made in another tab', () => {
    fakeSystem(false)
    const { result } = renderHook(() => useTheme())

    act(() => {
      localStorage.setItem(STORAGE_KEY, 'dark')
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }))
    })

    expect(result.current.preference).toBe('dark')
    expect(root).toHaveClass('dark')
  })

  it('sets the colour scheme and browser theme colour', () => {
    fakeSystem(false)
    renderHook(() => useTheme())

    act(() => setThemePreference('dark'))
    expect(root.style.colorScheme).toBe('dark')
    expect(themeColor()).toBe(THEME_COLORS.dark)

    act(() => setThemePreference('light'))
    expect(root.style.colorScheme).toBe('light')
    expect(themeColor()).toBe(THEME_COLORS.light)
  })
})

// index.html applies the theme before the app loads. Run that exact script so
// it cannot drift from the constants above.
describe('the pre-paint script in index.html', () => {
  const script = /<script>([\s\S]*?)<\/script>/.exec(indexHtml)![1]!
  const run = () => new Function(script)()

  it.each([
    ['a saved dark choice', 'dark', false, 'dark'],
    ['a saved light choice on a dark system', 'light', true, 'light'],
    ['no choice on a dark system', null, true, 'dark'],
    ['no choice on a light system', null, false, 'light'],
  ] as const)('applies %s', (_label, saved, systemDark, expected) => {
    fakeSystem(systemDark)
    if (saved) localStorage.setItem(STORAGE_KEY, saved)

    run()

    expect(root.classList.contains('dark')).toBe(expected === 'dark')
    expect(root.style.colorScheme).toBe(expected)
    expect(themeColor()).toBe(THEME_COLORS[expected])
  })
})
