import type { Goal } from '@expenses/shared'
import { ProgressBar } from '@/components/ProgressBar'
import { useCurrency } from '@/lib/auth'
import { formatLongDate, today } from '@/lib/dates'
import { goalPace } from '@/lib/goals'
import { formatMoney } from '@/lib/money'

// A goal's bar, saved amount, and what it will take to reach it in time.
export function GoalProgress({ goal }: { goal: Goal }) {
  const currency = useCurrency()
  const pace = goalPace(goal, today())
  const reached = pace.kind === 'reached'

  return (
    <div className="grid gap-2">
      <ProgressBar
        label={`${goal.name} progress`}
        value={goal.savedAmount}
        max={goal.targetAmount}
        tone={reached ? 'success' : 'default'}
      />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
        <p className={reached ? 'font-medium text-success-text' : 'text-muted-foreground'}>
          {pace.kind === 'reached' && 'Goal reached'}
          {pace.kind === 'no-date' && 'No target date'}
          {pace.kind === 'overdue' &&
            `Target date ${formatLongDate(goal.targetDate!)} has passed`}
          {pace.kind === 'monthly' &&
            `${formatMoney(pace.amount, currency)} a month to reach it by ${formatLongDate(goal.targetDate!)}`}
        </p>
        <p className="whitespace-nowrap tabular-nums">
          {formatMoney(goal.savedAmount, currency)}{' '}
          <span className="text-muted-foreground">of {formatMoney(goal.targetAmount, currency)}</span>
        </p>
      </div>
    </div>
  )
}
