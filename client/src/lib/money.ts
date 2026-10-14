import { currencyFractionDigits as fractionDigits } from '@expenses/shared'

// Amounts travel as whole numbers of the currency's smallest unit. These
// helpers convert to and from what a person reads and types.

export function formatMoney(amount: number, currency: string): string {
  const digits = fractionDigits(currency)
  return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(
    amount / 10 ** digits,
  )
}

// The plain number to prefill an amount field with, e.g. 50000 or 12.50.
export function toAmountInput(amount: number, currency: string): string {
  const digits = fractionDigits(currency)
  return (amount / 10 ** digits).toFixed(digits)
}

// Returns null when the text is not a number.
export function parseAmountInput(text: string, currency: string): number | null {
  const digits = fractionDigits(currency)
  // Without decimals, dots and commas can only be thousands separators.
  const cleaned = digits === 0 ? text.replace(/[\s.,]/g, '') : text.replace(/[\s,]/g, '')
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null
  return Math.round(Number(cleaned) * 10 ** digits)
}
