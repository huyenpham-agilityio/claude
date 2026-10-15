import { act, renderHook } from '@testing-library/react'
import i18next from 'i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { compareNames, readLanguage, setLanguage, useLanguage } from '../language.ts'

function browserLanguages(languages: string[]) {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages)
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('readLanguage', () => {
  it('follows a Vietnamese browser on the first visit', () => {
    browserLanguages(['vi-VN', 'en-US'])
    expect(readLanguage()).toBe('vi')
  })

  it('uses English for any other browser language', () => {
    browserLanguages(['fr-FR', 'vi-VN'])
    expect(readLanguage()).toBe('en')
  })

  it('prefers a saved choice over the browser', () => {
    browserLanguages(['vi-VN'])
    localStorage.setItem('language', 'en')
    expect(readLanguage()).toBe('en')
  })

  it('ignores a saved value it does not know', () => {
    browserLanguages(['vi'])
    localStorage.setItem('language', 'fr')
    expect(readLanguage()).toBe('vi')
  })

  it('falls back to the browser when storage is unavailable', () => {
    browserLanguages(['vi-VN'])
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readLanguage()).toBe('vi')
  })

  it('does not save the detected language', () => {
    browserLanguages(['vi-VN'])
    readLanguage()
    expect(localStorage.getItem('language')).toBeNull()
  })
})

describe('setLanguage', () => {
  it('applies, translates and remembers the choice', () => {
    setLanguage('vi')

    expect(i18next.resolvedLanguage).toBe('vi')
    expect(document.documentElement.lang).toBe('vi')
    expect(document.title).toBe('Chi tiêu gia đình')
    expect(localStorage.getItem('language')).toBe('vi')
  })

  it('still applies the choice when it cannot be saved', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })

    setLanguage('vi')

    expect(document.documentElement.lang).toBe('vi')
  })
})

describe('useLanguage', () => {
  it('starts in the browser language on a first visit, from the first render', async () => {
    browserLanguages(['vi-VN'])
    // A fresh copy of the module, as on page load.
    vi.resetModules()
    const fresh = await import('../language.ts')
    const seen: string[] = []

    renderHook(() => seen.push(fresh.useLanguage().language))

    expect(seen[0]).toBe('vi')
  })

  it('follows a change made in another tab', () => {
    const { result } = renderHook(() => useLanguage())
    expect(result.current.language).toBe('en')

    act(() => {
      localStorage.setItem('language', 'vi')
      window.dispatchEvent(new StorageEvent('storage', { key: 'language', newValue: 'vi' }))
    })

    expect(result.current.language).toBe('vi')
    expect(document.documentElement.lang).toBe('vi')
  })
})

describe('compareNames', () => {
  it('puts Vietnamese letters in alphabet order', () => {
    const names = ['Tiền nhà', 'Điện nước', 'Ăn ngoài', 'Mua sắm', 'Đi chợ', 'Giải trí']

    expect(names.toSorted((a, b) => compareNames(a, b, 'vi'))).toEqual([
      'Ăn ngoài',
      'Đi chợ',
      'Điện nước',
      'Giải trí',
      'Mua sắm',
      'Tiền nhà',
    ])
  })
})
