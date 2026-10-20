import { describe, expect, it } from 'vitest'
import { en } from '@/locales/en'
import { vi } from '@/locales/vi'

// Flattens nested messages to "section.key" → text.
function flatten(messages: object, prefix = ''): Record<string, string> {
  return Object.fromEntries(
    Object.entries(messages).flatMap(([key, value]) =>
      typeof value === 'string'
        ? [[`${prefix}${key}`, value]]
        : Object.entries(flatten(value as object, `${prefix}${key}.`)),
    ),
  )
}

const placeholders = (text: string) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort()

// The same in both languages on purpose.
const SAME_IN_BOTH = new Set(['auth.email', 'overview.lastMonth', 'reports.range'])

const english = flatten(en)
const vietnamese = flatten(vi)
// English singular forms have no Vietnamese counterpart: Vietnamese has one form.
const keys = Object.keys(english).filter((key) => !key.endsWith('_one'))

describe('Vietnamese messages', () => {
  it('cover every English message and nothing else', () => {
    expect(Object.keys(vietnamese).sort()).toEqual(keys.sort())
  })

  it.each(keys)('%s keeps the same placeholders', (key) => {
    expect(placeholders(vietnamese[key]!)).toEqual(placeholders(english[key]!))
  })

  it('are all translated', () => {
    const untranslated = keys.filter(
      (key) => !vietnamese[key]?.trim() || (vietnamese[key] === english[key] && !SAME_IN_BOTH.has(key)),
    )
    expect(untranslated).toEqual([])
  })
})
