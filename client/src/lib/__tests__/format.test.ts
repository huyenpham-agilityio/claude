import { describe, expect, it } from 'vitest'
import { formatDay, formatLongDate, formatMonth } from '../dates.ts'
import { setLanguage } from '../language.ts'
import { formatCompact, formatMoney } from '../money.ts'

// Intl separates the amount and the symbol with a no-break space.
const plain = (text: string) => text.replace(/\u00a0/g, ' ')

describe('formatting in English', () => {
  it('keeps the US forms', () => {
    expect(formatMoney(800_000, 'VND')).toBe('₫800,000')
    expect(formatMonth('2026-10')).toBe('October 2026')
    expect(formatLongDate('2027-04-01')).toBe('April 1, 2027')
    expect(formatCompact(1_500_000, 'VND')).toBe('1.5M')
  })
})

describe('formatting in Vietnamese', () => {
  it('uses Vietnamese separators, month names and order', () => {
    setLanguage('vi')

    expect(plain(formatMoney(800_000, 'VND'))).toBe('800.000 ₫')
    expect(formatMonth('2026-10')).toBe('tháng 10 năm 2026')
    expect(formatDay('2026-10-03')).toBe('Thứ 7, 3 thg 10')
    expect(formatLongDate('2027-04-01')).toBe('1 tháng 4, 2027')
    expect(plain(formatCompact(1_500_000, 'VND'))).toBe('1,5 Tr')
  })
})
