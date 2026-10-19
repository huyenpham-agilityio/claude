import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readSavedPreset, savePreset } from '../reports.ts'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('readSavedPreset', () => {
  it('is null when nothing was chosen', () => {
    expect(readSavedPreset()).toBeNull()
  })

  it('returns the saved period', () => {
    localStorage.setItem('reportsRange', 'this-year')
    expect(readSavedPreset()).toBe('this-year')
  })

  it('ignores a saved value it does not know', () => {
    localStorage.setItem('reportsRange', 'forever')
    expect(readSavedPreset()).toBeNull()
  })

  it('is null when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readSavedPreset()).toBeNull()
  })
})

describe('savePreset', () => {
  it('remembers the choice, replacing the previous one', () => {
    savePreset('last-12')
    savePreset('last-3')
    expect(readSavedPreset()).toBe('last-3')
  })

  it('does not throw when it cannot be saved', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => savePreset('last-12')).not.toThrow()
  })
})
