import { type Transaction, monthSchema, transactionTypeSchema } from '@expenses/shared'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { CategoryDot } from '@/components/CategoryDot'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { TransactionDialog } from '@/components/TransactionDialog'
import { IconButton } from '@/components/IconButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from '@/components/ui/native-select'
import { useCurrency } from '@/lib/auth'
import { useCategories } from '@/lib/categories'
import { currentMonth, formatDay, formatMonth } from '@/lib/dates'
import { useErrorText } from '@/lib/errors'
import { formatMoney } from '@/lib/money'
import { type TransactionFilters, useDeleteTransaction, useTransactions } from '@/lib/transactions'

const SEARCH_DELAY_MS = 300

// Filters live in the URL so a view can be reloaded, bookmarked, and stepped
// through with the back button.
function useFilters() {
  const [params, setParams] = useSearchParams()

  const month = monthSchema.safeParse(params.get('month'))
  const type = transactionTypeSchema.safeParse(params.get('type'))
  const filters: TransactionFilters = {
    month: month.success ? month.data : currentMonth(),
    type: type.success ? type.data : undefined,
    categoryId: params.get('category') || undefined,
    q: params.get('q') || undefined,
    page: Math.max(1, Number(params.get('page')) || 1),
  }

  // Any filter change goes back to the first page unless it sets the page itself.
  const update = (changes: Record<string, string | undefined>, replace = false) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('page')
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        return next
      },
      { replace },
    )

  return [filters, update] as const
}

function groupByDay(transactions: Transaction[]) {
  const groups: { day: string; items: Transaction[] }[] = []
  for (const transaction of transactions) {
    const last = groups.at(-1)
    if (last?.day === transaction.date) last.items.push(transaction)
    else groups.push({ day: transaction.date, items: [transaction] })
  }
  return groups
}

type Editing = { transaction: Transaction | null } | null

export function Transactions() {
  const currency = useCurrency()
  const { t } = useTranslation()
  const errorText = useErrorText()
  const [filters, updateFilters] = useFilters()
  const categories = useCategories()
  const transactions = useTransactions(filters)
  const remove = useDeleteTransaction()
  const [editing, setEditing] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)

  // The search box updates the URL shortly after typing stops.
  const [search, setSearch] = useState(filters.q ?? '')
  useEffect(() => {
    if (search.trim() === (filters.q ?? '')) return
    const timer = setTimeout(
      () => updateFilters({ q: search.trim() || undefined }, true),
      SEARCH_DELAY_MS,
    )
    return () => clearTimeout(timer)
  })

  const closeDelete = () => {
    setDeleting(null)
    remove.reset()
  }

  const data = transactions.data
  const monthLabel = formatMonth(filters.month)
  const isFiltered = !!(filters.type || filters.categoryId || filters.q)
  const signed = (transaction: Transaction) =>
    `${transaction.type === 'income' ? '+' : '−'}${formatMoney(transaction.amount, currency)}`

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">{t('transactions.title')}</h2>
        <Button onClick={() => setEditing({ transaction: null })} disabled={!categories.data}>
          <Plus aria-hidden="true" /> {t('transactions.add')}
        </Button>
      </div>

      <div className="mt-6">
        <MonthSwitcher month={filters.month} onChange={(month) => updateFilters({ month })} />
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: t('common.income'), value: data?.totals.income },
          { label: t('common.expenses'), value: data?.totals.expense },
          { label: t('common.net'), value: data && data.totals.income - data.totals.expense },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border px-4 py-3">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums">
              {value === undefined ? '…' : formatMoney(value, currency)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:flex">
        <NativeSelect
          aria-label={t('common.type')}
          className="w-full sm:w-auto"
          value={filters.type ?? ''}
          onChange={(event) => updateFilters({ type: event.target.value || undefined })}
        >
          <NativeSelectOption value="">{t('transactions.allTypes')}</NativeSelectOption>
          <NativeSelectOption value="expense">{t('transactions.filterExpenses')}</NativeSelectOption>
          <NativeSelectOption value="income">{t('transactions.filterIncome')}</NativeSelectOption>
        </NativeSelect>
        <NativeSelect
          aria-label={t('common.category')}
          className="w-full sm:w-auto"
          value={filters.categoryId ?? ''}
          onChange={(event) => updateFilters({ category: event.target.value || undefined })}
        >
          <NativeSelectOption value="">{t('transactions.allCategories')}</NativeSelectOption>
          {transactionTypeSchema.options.map((type) => (
            <NativeSelectOptGroup key={type} label={type === 'expense' ? t('transactions.filterExpenses') : t('transactions.filterIncome')}>
              {categories.data
                ?.filter((category) => category.type === type)
                .map((category) => (
                  <NativeSelectOption key={category.id} value={category.id}>
                    {category.name}
                  </NativeSelectOption>
                ))}
            </NativeSelectOptGroup>
          ))}
        </NativeSelect>
        <Input
          type="search"
          aria-label={t('transactions.searchLabel')}
          placeholder={t('transactions.searchPlaceholder')}
          className="col-span-2 sm:max-w-56"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <div className="mt-6">
        {transactions.isPending && (
          <p role="status" className="text-sm text-muted-foreground">
            {t('common.loading')}
          </p>
        )}
        {transactions.isError && (
          <p role="alert" className="text-sm text-destructive">
            {t('transactions.loadFailed', { message: errorText(transactions.error) })}
          </p>
        )}
        {data?.total === 0 && (
          <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            {isFiltered
              ? t('transactions.noMatches', { month: monthLabel })
              : t('transactions.emptyMonth', { month: monthLabel })}
          </p>
        )}

        {data &&
          groupByDay(data.transactions).map(({ day, items }) => (
            <section key={day} className="mt-4 first:mt-0">
              <h3 className="text-sm font-medium text-muted-foreground">{formatDay(day)}</h3>
              <ul className="mt-2 divide-y rounded-xl border">
                {items.map((transaction) => (
                  <li key={transaction.id} className="flex items-center gap-3 px-4 py-2.5">
                    <CategoryDot color={transaction.category.color} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{transaction.category.name}</p>
                      {transaction.note && (
                        <p className="truncate text-sm text-muted-foreground">{transaction.note}</p>
                      )}
                    </div>
                    <p
                      className={`font-medium whitespace-nowrap tabular-nums ${
                        transaction.type === 'income' ? 'text-success-text' : ''
                      }`}
                    >
                      {signed(transaction)}
                    </p>
                    <IconButton
                      variant="ghost"
                      size="icon-sm"
                      tooltip={t('tooltips.editTransaction')}
                      aria-label={t('transactions.editLabel', {
                        category: transaction.category.name,
                        amount: signed(transaction),
                      })}
                      onClick={() => setEditing({ transaction })}
                    >
                      <Pencil aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      variant="ghost"
                      size="icon-sm"
                      tooltip={t('tooltips.deleteTransaction')}
                      aria-label={t('transactions.deleteLabel', {
                        category: transaction.category.name,
                        amount: signed(transaction),
                      })}
                      onClick={() => setDeleting(transaction)}
                    >
                      <Trash2 aria-hidden="true" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            </section>
          ))}

        {data && data.pageCount > 1 && (
          <nav aria-label={t('transactions.pages')} className="mt-6 flex items-center justify-between gap-4">
            <Button
              variant="outline"
              disabled={data.page <= 1}
              onClick={() => updateFilters({ page: String(data.page - 1) })}
            >
              {t('transactions.newer')}
            </Button>
            <p className="text-sm text-muted-foreground">
              {t('transactions.pageOf', { page: data.page, count: data.pageCount })}
            </p>
            <Button
              variant="outline"
              disabled={data.page >= data.pageCount}
              onClick={() => updateFilters({ page: String(data.page + 1) })}
            >
              {t('transactions.older')}
            </Button>
          </nav>
        )}
      </div>

      <TransactionDialog
        open={editing !== null}
        transaction={editing?.transaction ?? null}
        categories={categories.data ?? []}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={t('transactions.deleteTitle')}
        description={
          deleting
            ? t('transactions.deleteDescription', {
                category: deleting.category.name,
                amount: signed(deleting),
                date: formatDay(deleting.date),
              })
            : ''
        }
        confirmLabel={t('common.delete')}
        pending={remove.isPending}
        error={errorText(remove.error)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: closeDelete })}
        onClose={closeDelete}
      />
    </section>
  )
}
