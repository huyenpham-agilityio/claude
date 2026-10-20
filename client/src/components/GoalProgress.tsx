import type { Goal } from '@expenses/shared'
import { useTranslation } from 'react-i18next'
import { ProgressBar } from '@/components/ProgressBar'
import { useCurrency } from '@/lib/auth'
import { formatLongDate, today } from '@/lib/dates'
import { goalAmountLeft, goalPace } from '@/lib/goals'
import { formatMoney } from '@/lib/money'

// A goal's bar, saved amount, and what it will take to reach it in time.
export function GoalProgress({ goal }: { goal: Goal }) {
  const currency = useCurrency()
  const { t } = useTranslation()
  const pace = goalPace(goal, today())
  const reached = pace.kind === 'reached'
  const amountLeft = goalAmountLeft(goal)

  return (
    <div className="grid gap-2">
      <ProgressBar
        label={t('savings.progressLabel', { name: goal.name })}
        value={goal.savedAmount}
        max={goal.targetAmount}
        tone={reached ? 'success' : 'default'}
      />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <p className={reached ? 'font-medium text-success-text' : 'text-muted-foreground'}>
          {pace.kind === 'reached' && t('savings.reached')}
          {pace.kind === 'no-date' && t('savings.noTargetDate')}
          {pace.kind === 'overdue' &&
            t('savings.overdue', { date: formatLongDate(goal.targetDate!) })}
          {pace.kind === 'monthly' &&
            t('savings.perMonth', {
              amount: formatMoney(pace.amount, currency),
              date: formatLongDate(goal.targetDate!),
            })}
        </p>
        <div className="whitespace-nowrap tabular-nums sm:text-right">
          <p>
            {formatMoney(goal.savedAmount, currency)}{' '}
            <span className="text-muted-foreground">
              {t('common.ofAmount', { amount: formatMoney(goal.targetAmount, currency) })}
            </span>
          </p>
          {!reached && (
            <p className="text-muted-foreground">
              {t('savings.amountLeft', { amount: formatMoney(amountLeft, currency) })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
