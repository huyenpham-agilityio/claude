import type { Report } from '@expenses/shared'
import { useTranslation } from 'react-i18next'
import { CategoryDot } from '@/components/CategoryDot'
import { useCurrency } from '@/lib/auth'
import { formatMoney } from '@/lib/money'

// A ranked list with a bar per category. Every value is printed, so it doubles
// as its own table. Bars share one colour: the dot beside each name carries
// the category's identity, and length carries the amount.
export function CategorySpending({ items }: { items: Report['spendingByCategory'] }) {
  const currency = useCurrency()
  const { t } = useTranslation()
  const total = items.reduce((sum, item) => sum + item.amount, 0)
  const largest = items[0]?.amount ?? 0

  return (
    <section className="min-w-0 rounded-xl border px-4 py-3">
      <h3 className="font-medium">{t('chart.spendingByCategory')}</h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t('chart.noSpending')}</p>
      ) : (
        <ul className="mt-3 grid gap-3">
          {items.map(({ category, amount }) => {
            const share = Math.round((amount / total) * 100)
            return (
              <li key={category.id} className="grid gap-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <CategoryDot color={category.color} />
                  <span className="min-w-0 flex-1 truncate font-medium">{category.name}</span>
                  <span className="whitespace-nowrap tabular-nums">{formatMoney(amount, currency)}</span>
                  <span className="w-10 text-right text-muted-foreground tabular-nums">{share}%</span>
                </div>
                <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(1, (amount / largest) * 100)}%`,
                      backgroundColor: 'var(--chart-income)',
                    }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
