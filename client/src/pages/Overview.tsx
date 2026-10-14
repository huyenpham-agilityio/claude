import { type Budget, budgetStatus, monthSchema } from '@expenses/shared'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { CategoryDot } from '@/components/CategoryDot'
import { GoalProgress } from '@/components/GoalProgress'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { ProgressBar } from '@/components/ProgressBar'
import { useCurrency } from '@/lib/auth'
import { budgetTone, useBudgets } from '@/lib/budgets'
import { currentMonth, formatDay, formatMonth, shiftMonth } from '@/lib/dates'
import { useGoals } from '@/lib/goals'
import { formatMoney } from '@/lib/money'
import { useTransactions } from '@/lib/transactions'

const RECENT_COUNT = 5
const GOALS_SHOWN = 3

function Panel({
  title,
  link,
  children,
}: {
  title: string
  link: { to: string; label: string }
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border px-4 py-3">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="font-medium">{title}</h3>
        <Link to={link.to} className="text-sm text-muted-foreground underline hover:text-foreground">
          {link.label}
        </Link>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Muted({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>
}

// Over-limit budgets first, then those close to it, each by how much is used.
function needingAttention(budgets: Budget[]) {
  const used = (budget: Budget) => budget.spent / budget.limitAmount
  return budgets
    .filter((budget) => budgetStatus(budget.spent, budget.limitAmount) !== 'ok')
    .sort((a, b) => used(b) - used(a))
}

export function Overview() {
  const currency = useCurrency()
  const [params, setParams] = useSearchParams()
  const parsedMonth = monthSchema.safeParse(params.get('month'))
  const month = parsedMonth.success ? parsedMonth.data : currentMonth()
  const previousMonth = shiftMonth(month, -1)

  const current = useTransactions({ month, page: 1 })
  const previous = useTransactions({ month: previousMonth, page: 1 })
  const budgets = useBudgets(month)
  const goals = useGoals()

  const totals = current.data?.totals
  const previousTotals = previous.data?.totals
  const net = totals && totals.income - totals.expense
  const savingsRate =
    totals && totals.income > 0 ? Math.round(((totals.income - totals.expense) / totals.income) * 100) : null
  const money = (value: number | undefined) => (value === undefined ? '…' : formatMoney(value, currency))
  const lastMonth = (value: number | undefined) =>
    value === undefined ? undefined : `${formatMonth(previousMonth)}: ${formatMoney(value, currency)}`

  const tiles = [
    { label: 'Income', value: money(totals?.income), note: lastMonth(previousTotals?.income) },
    { label: 'Expenses', value: money(totals?.expense), note: lastMonth(previousTotals?.expense) },
    { label: 'Net', value: money(net), note: 'Income minus expenses' },
    {
      label: 'Savings rate',
      value: !totals ? '…' : savingsRate === null ? '–' : `${savingsRate}%`,
      note: savingsRate === null && totals ? 'No income recorded' : 'Share of income kept',
    },
  ]

  const attention = budgets.data ? needingAttention(budgets.data.budgets) : []
  const recent = current.data?.transactions.slice(0, RECENT_COUNT) ?? []

  return (
    <section>
      <h2 className="text-2xl font-semibold">Overview</h2>

      <div className="mt-6">
        <MonthSwitcher month={month} onChange={(next) => setParams({ month: next })} />
      </div>

      {current.isError && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          Could not load this month. {current.error.message}
        </p>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ label, value, note }) => (
          <div key={label} className="rounded-xl border px-4 py-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
            {note && <dd className="mt-1 text-xs text-muted-foreground">{note}</dd>}
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Panel title="Budgets" link={{ to: `/budgets?month=${month}`, label: 'All budgets' }}>
          {budgets.isPending && <Muted>Loading…</Muted>}
          {budgets.data?.budgets.length === 0 && <Muted>No budgets set for this month.</Muted>}
          {budgets.data && budgets.data.budgets.length > 0 && attention.length === 0 && (
            <Muted>
              {budgets.data.budgets.length === 1
                ? 'Your budget is on track.'
                : `All ${budgets.data.budgets.length} budgets are on track.`}
            </Muted>
          )}
          {attention.length > 0 && (
            <ul className="grid gap-3">
              {attention.map((budget) => {
                const over = budget.spent > budget.limitAmount
                return (
                  <li key={budget.id} className="grid gap-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <CategoryDot color={budget.category.color} />
                      <span className="min-w-0 flex-1 truncate font-medium">{budget.category.name}</span>
                      <span className={over ? 'text-destructive' : 'text-warning-text'}>
                        {over
                          ? `Over by ${formatMoney(budget.spent - budget.limitAmount, currency)}`
                          : budget.spent === budget.limitAmount
                            ? 'Limit reached'
                            : `${Math.round((budget.spent / budget.limitAmount) * 100)}% used`}
                      </span>
                    </div>
                    <ProgressBar
                      label={`${budget.category.name} budget`}
                      value={budget.spent}
                      max={budget.limitAmount}
                      tone={budgetTone(budget.spent, budget.limitAmount)}
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Recent transactions" link={{ to: `/transactions?month=${month}`, label: 'See all' }}>
          {current.isPending && <Muted>Loading…</Muted>}
          {current.data && recent.length === 0 && <Muted>Nothing recorded this month.</Muted>}
          {recent.length > 0 && (
            <ul className="grid gap-2">
              {recent.map((transaction) => (
                <li key={transaction.id} className="flex items-center gap-2 text-sm">
                  <CategoryDot color={transaction.category.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{transaction.category.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDay(transaction.date)}
                      {transaction.note && ` · ${transaction.note}`}
                    </p>
                  </div>
                  <span
                    className={`whitespace-nowrap tabular-nums ${
                      transaction.type === 'income' ? 'text-success-text' : ''
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '−'}
                    {formatMoney(transaction.amount, currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <div className="md:col-span-2">
          <Panel title="Savings goals" link={{ to: '/savings', label: 'Manage' }}>
            {goals.isPending && <Muted>Loading…</Muted>}
            {goals.data?.length === 0 && <Muted>No savings goals yet.</Muted>}
            {goals.data && goals.data.length > 0 && (
              <ul className="grid gap-4 md:grid-cols-2">
                {goals.data.slice(0, GOALS_SHOWN).map((goal) => (
                  <li key={goal.id} className="grid gap-1.5">
                    <p className="truncate text-sm font-medium">{goal.name}</p>
                    <GoalProgress goal={goal} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </section>
  )
}
