// Amounts are stored as whole numbers of the currency's smallest unit; this
// says how many of those make up one unit (VND 0, USD 2).
export function currencyFractionDigits(currency: string): number {
  return (
    new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
      .maximumFractionDigits ?? 0
  )
}
