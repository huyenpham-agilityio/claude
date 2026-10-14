import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readPreference, resolveTheme } from '../theme.ts'

function systemPrefersDark(dark: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query) => ({ matches: dark, media: query }) as MediaQueryList,
  )
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('resolveTheme', () => {
  it('follows the system when set to system', () => {
    systemPrefersDark(true)
    expect(resolveTheme('system')).toBe('dark')

    systemPrefersDark(false)
    expect(resolveTheme('system')).toBe('light')
  })

  it('ignores the system once a theme is chosen', () => {
    systemPrefersDark(true)
    expect(resolveTheme('light')).toBe('light')
  })
})

describe('readPreference', () => {
  it('defaults to system', () => {
    expect(readPreference()).toBe('system')
  })

  it('reads a saved choice and ignores junk', () => {
    localStorage.setItem('theme', 'dark')
    expect(readPreference()).toBe('dark')

    localStorage.setItem('theme', 'purple')
    expect(readPreference()).toBe('system')
  })

  it('falls back to system when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readPreference()).toBe('system')
  })
})
