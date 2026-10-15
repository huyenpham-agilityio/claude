import { monthsBetween } from '@expenses/shared'
import { Download } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { CategorySpending } from '@/components/CategorySpending'
import { IncomeExpenseChart } from '@/components/IncomeExpenseChart'
import { Button } from '@/components/ui/button'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { useCurrency } from '@/lib/auth'
import { formatMonth } from '@/lib/dates'
import { useErrorText } from '@/lib/errors'
import { formatMoney } from '@/lib/money'
import {
  RANGE_PRESETS,
  type RangePreset,
  csvExportUrl,
  isRangePreset,
  presetRange,
  useReport,
} from '@/lib/reports'

const DEFAULT_PRESET: RangePreset = 'last-6'

export function Reports() {
  const currency = useCurrency()
  const { t } = useTranslation()
  const errorText = useErrorText()
  const [params, setParams] = useSearchParams()
  const requested = params.get('range')
  const preset = isRangePreset(requested) ? requested : DEFAULT_PRESET
  const range = presetRange(preset)
  const report = useReport(range)

  const data = report.data
  const income = data?.months.reduce((sum, month) => sum + month.income, 0)
  const expense = data?.months.reduce((sum, month) => sum + month.expense, 0)
  const monthCount = monthsBetween(range.from, range.to)
  const money = (value: number | undefined) => (value === undefined ? '…' : formatMoney(value, currency))

  const tiles = [
    { label: t('common.income'), value: money(income) },
    { label: t('common.expenses'), value: money(expense) },
    { label: t('common.net'), value: money(income !== undefined && expense !== undefined ? income - expense : undefined) },
    {
      label: t('reports.averageMonthlySpending'),
      value: money(expense === undefined ? undefined : Math.round(expense / monthCount)),
    },
  ]

  return (
    <section>
      <h2 className="text-2xl font-semibold">{t('reports.title')}</h2>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <NativeSelect
          aria-label={t('reports.period')}
          value={preset}
          onChange={(event) => setParams({ range: event.target.value })}
        >
          {Object.entries(RANGE_PRESETS).map(([value, label]) => (
            <NativeSelectOption key={value} value={value}>
              {t(label)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <p className="text-sm text-muted-foreground">
          {t('reports.range', { from: formatMonth(range.from), to: formatMonth(range.to) })}
        </p>
        <Button asChild variant="outline" className="sm:ml-auto">
          <a href={csvExportUrl(range)} download>
            <Download aria-hidden="true" /> {t('reports.exportCsv')}
          </a>
        </Button>
      </div>

      {report.isError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {t('reports.loadFailed', { message: errorText(report.error) })}
        </p>
      )}

      {/* While a new period loads, the previous one stays visible but faded. */}
      <div className={`transition-opacity ${report.isPlaceholderData ? 'opacity-60' : ''}`}>
        <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tiles.map(({ label, value }) => (
            <div key={label} className="rounded-xl border px-4 py-3">
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="mt-1 text-lg font-semibold">{value}</dd>
            </div>
          ))}
        </dl>

        {report.isPending && (
          <p role="status" className="mt-6 text-sm text-muted-foreground">
            {t('common.loading')}
          </p>
        )}

        {data && (
          <div className="mt-4 grid gap-4">
            <IncomeExpenseChart months={data.months} />
            <CategorySpending items={data.spendingByCategory} />
          </div>
        )}
      </div>
    </section>
  )
}
