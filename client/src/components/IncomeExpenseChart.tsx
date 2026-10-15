import type { Report } from '@expenses/shared'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/lib/auth'
import { formatMonth } from '@/lib/dates'
import { currentLocaleTag } from '@/lib/language'
import { formatCompact, formatMoney } from '@/lib/money'

const SERIES = [
  { key: 'income', label: 'common.income', color: 'var(--chart-income)' },
  { key: 'expense', label: 'common.expenses', color: 'var(--chart-expense)' },
] as const

// "Oct", with the year on January and on the first column so it is never lost.
function axisLabel(month: string, index: number): string {
  const [year, monthNumber] = month.split('-').map(Number) as [number, number]
  const parts = new Intl.DateTimeFormat(currentLocaleTag(), {
    month: 'short',
    year: '2-digit',
  }).formatToParts(new Date(year, monthNumber - 1, 1))
  if (index === 0 || monthNumber === 1) return parts.map((part) => part.value).join('')
  // The month on its own, in the same short form as above. Formatting a month
  // without a year gives a longer form in some languages ("Tháng 7").
  return parts.find((part) => part.type === 'month')!.value
}

function ChartTooltip({ active, payload, label, currency }: TooltipContentProps & { currency: string }) {
  const { t } = useTranslation()
  if (!active || !payload?.length) return null
  const month = String(payload[0]!.payload.month)

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="text-xs text-muted-foreground">{label && formatMonth(month)}</p>
      <ul className="mt-1 grid gap-1">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-0.5 w-3 rounded-full" style={{ backgroundColor: series.color }} />
            <span className="font-semibold tabular-nums">
              {formatMoney(Number(payload[0]!.payload[series.key]), currency)}
            </span>
            <span className="text-muted-foreground">{t(series.label)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function IncomeExpenseChart({ months }: { months: Report['months'] }) {
  const currency = useCurrency()
  const [showTable, setShowTable] = useState(false)
  const { t } = useTranslation()
  const data = months.map((entry, index) => ({ ...entry, label: axisLabel(entry.month, index) }))

  return (
    <figure className="min-w-0 rounded-xl border px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <figcaption>
          <h3 className="font-medium">{t('chart.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('chart.amountsIn', { currency })}</p>
        </figcaption>
        <Button variant="outline" size="sm" aria-pressed={showTable} onClick={() => setShowTable(!showTable)}>
          {showTable ? t('chart.showChart') : t('chart.showTable')}
        </Button>
      </div>

      {showTable ? (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th scope="col" className="py-2 pr-4 font-medium">{t('chart.month')}</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">{t('common.income')}</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">{t('common.expenses')}</th>
                <th scope="col" className="py-2 text-right font-medium">{t('common.net')}</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {months.map(({ month, income, expense }) => (
                <tr key={month} className="border-b last:border-0">
                  <th scope="row" className="py-2 pr-4 text-left font-normal">{formatMonth(month)}</th>
                  <td className="py-2 pr-4 text-right">{formatMoney(income, currency)}</td>
                  <td className="py-2 pr-4 text-right">{formatMoney(expense, currency)}</td>
                  <td className="py-2 text-right">{formatMoney(income - expense, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <ul className="mt-3 flex gap-4 text-sm" aria-label={t('chart.legend')}>
            {SERIES.map((series) => (
              <li key={series.key} className="flex items-center gap-1.5">
                <span aria-hidden="true" className="size-2.5 rounded-sm" style={{ backgroundColor: series.color }} />
                {t(series.label)}
              </li>
            ))}
          </ul>
          <div className="mt-2 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} barGap={2} barCategoryGap="25%" accessibilityLayer margin={{ left: 0, right: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--chart-grid)" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: 'var(--chart-axis)' }}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tickFormatter={(value: number) => formatCompact(value, currency)}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                  width={44}
                />
                <Tooltip
                  content={(props) => <ChartTooltip {...props} currency={currency} />}
                  cursor={{ fill: 'var(--muted)', opacity: 0.6 }} />
                {SERIES.map((series) => (
                  <Bar
                    key={series.key}
                    dataKey={series.key}
                    name={t(series.label)}
                    fill={series.color}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={24}
                    isAnimationActive={false}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </figure>
  )
}
