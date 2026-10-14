import { type Budget, type BudgetStatus, budgetStatus, monthSchema } from '@expenses/shared'
import { CircleAlert, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { BudgetDialog } from '@/components/BudgetDialog'
import { CategoryDot } from '@/components/CategoryDot'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { ProgressBar } from '@/components/ProgressBar'
import { Button } from '@/components/ui/button'
import { useCurrency } from '@/lib/auth'
import { budgetTone, useBudgets, useCopyBudgets, useDeleteBudget } from '@/lib/budgets'
import { useCategories } from '@/lib/categories'
import { currentMonth, formatMonth } from '@/lib/dates'
import { formatMoney } from '@/lib/money'

const STATUS_TEXT_CLASSES: Record<BudgetStatus, string> = {
  ok: 'text-muted-foreground',
  warning: 'text-amber-700',
  over: 'text-destructive',
}

// Says in words what the bar's colour shows, so colour is never the only cue.
function StatusNote({ spent, limit, currency }: { spent: number; limit: number; currency: string }) {
  const status = budgetStatus(spent, limit)
  const percent = Math.round((spent / limit) * 100)

  return (
    <p className={`flex items-center gap-1 text-sm ${STATUS_TEXT_CLASSES[status]}`}>
      {status === 'warning' && <TriangleAlert aria-hidden="true" className="size-4" />}
      {status === 'over' && <CircleAlert aria-hidden="true" className="size-4" />}
      {status === 'over'
        ? `Over by ${formatMoney(spent - limit, currency)}`
        : spent === limit
          ? 'Limit reached'
          : status === 'warning'
            ? `${percent}% used, close to the limit`
            : `${percent}% used`}
    </p>
  )
}

function SpentOfLimit({ spent, limit, currency }: { spent: number; limit: number; currency: string }) {
  return (
    <p className="text-sm whitespace-nowrap tabular-nums">
      {formatMoney(spent, currency)}{' '}
      <span className="text-muted-foreground">of {formatMoney(limit, currency)}</span>
    </p>
  )
}

type Editing = { budget: Budget | null } | null

export function Budgets() {
  const currency = useCurrency()
  const [params, setParams] = useSearchParams()
  const parsedMonth = monthSchema.safeParse(params.get('month'))
  const month = parsedMonth.success ? parsedMonth.data : currentMonth()

  const budgets = useBudgets(month)
  const categories = useCategories()
  const copy = useCopyBudgets()
  const remove = useDeleteBudget()
  const [editing, setEditing] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<Budget | null>(null)

  const closeDelete = () => {
    setDeleting(null)
    remove.reset()
  }

  const data = budgets.data
  const monthLabel = formatMonth(month)
  const budgeted = new Set(data?.budgets.map((budget) => budget.category.id))
  const availableCategories = (categories.data ?? []).filter(
    (category) => category.type === 'expense' && !budgeted.has(category.id),
  )
  const totalLimit = data?.budgets.reduce((sum, budget) => sum + budget.limitAmount, 0) ?? 0
  const totalSpent = data?.budgets.reduce((sum, budget) => sum + budget.spent, 0) ?? 0

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Budgets</h2>
        <Button
          onClick={() => setEditing({ budget: null })}
          disabled={!data || availableCategories.length === 0}
        >
          <Plus aria-hidden="true" /> Set budget
        </Button>
      </div>

      <div className="mt-6">
        <MonthSwitcher month={month} onChange={(next) => setParams({ month: next })} />
      </div>

      <div className="mt-6">
        {budgets.isPending && (
          <p role="status" className="text-sm text-muted-foreground">
            Loading…
          </p>
        )}
        {budgets.isError && (
          <p role="alert" className="text-sm text-destructive">
            Could not load budgets. {budgets.error.message}
          </p>
        )}

        {data?.budgets.length === 0 && (
          <div className="rounded-xl border border-dashed px-4 py-10 text-center">
            <p className="text-sm text-muted-foreground">No budgets for {monthLabel} yet.</p>
            {data.copyFrom && (
              <Button
                variant="outline"
                className="mt-4"
                disabled={copy.isPending}
                onClick={() => copy.mutate({ from: data.copyFrom!, to: month })}
              >
                Copy budgets from {formatMonth(data.copyFrom)}
              </Button>
            )}
            {copy.error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {copy.error.message}
              </p>
            )}
          </div>
        )}

        {data && data.budgets.length > 0 && (
          <>
            <div className="rounded-xl border px-4 py-3">
              <p className="font-medium">All budgets</p>
              <div className="mt-2">
                <ProgressBar
                  label="All budgets"
                  value={totalSpent}
                  max={totalLimit}
                  tone={budgetTone(totalSpent, totalLimit)}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <StatusNote spent={totalSpent} limit={totalLimit} currency={currency} />
                <SpentOfLimit spent={totalSpent} limit={totalLimit} currency={currency} />
              </div>
            </div>

            <ul className="mt-4 divide-y rounded-xl border">
              {data.budgets.map((budget) => (
                <li key={budget.id} className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <CategoryDot color={budget.category.color} />
                    <p className="min-w-0 flex-1 truncate font-medium">{budget.category.name}</p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Edit ${budget.category.name} budget`}
                      onClick={() => setEditing({ budget })}
                    >
                      <Pencil aria-hidden="true" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${budget.category.name} budget`}
                      onClick={() => setDeleting(budget)}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="mt-2">
                    <ProgressBar
                      label={`${budget.category.name} budget`}
                      value={budget.spent}
                      max={budget.limitAmount}
                      tone={budgetTone(budget.spent, budget.limitAmount)}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                    <StatusNote
                      spent={budget.spent}
                      limit={budget.limitAmount}
                      currency={currency}
                    />
                    <SpentOfLimit
                      spent={budget.spent}
                      limit={budget.limitAmount}
                      currency={currency}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <BudgetDialog
        open={editing !== null}
        month={month}
        budget={editing?.budget ?? null}
        availableCategories={availableCategories}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={`Delete the ${deleting?.category.name ?? ''} budget?`}
        description={`This removes the limit for ${monthLabel}. Your transactions are not affected.`}
        confirmLabel="Delete"
        pending={remove.isPending}
        error={remove.error?.message ?? null}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: closeDelete })}
        onClose={closeDelete}
      />
    </section>
  )
}
