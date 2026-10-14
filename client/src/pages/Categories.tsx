import { type Category, transactionTypeSchema } from '@expenses/shared'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CategoryDialog } from '@/components/CategoryDialog'
import { CategoryDot } from '@/components/CategoryDot'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useCategories, useDeleteCategory } from '@/lib/categories'
import { useErrorText } from '@/lib/errors'

const SECTION_TITLES = {
  expense: 'categories.expenseSection',
  income: 'categories.incomeSection',
} as const

type Editing = { category: Category | null } | null

export function Categories() {
  const { t } = useTranslation()
  const errorText = useErrorText()
  const categories = useCategories()
  const remove = useDeleteCategory()
  const [editing, setEditing] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)

  const closeDelete = () => {
    setDeleting(null)
    remove.reset()
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">{t('categories.title')}</h2>
        <Button onClick={() => setEditing({ category: null })}>
          <Plus aria-hidden="true" /> {t('categories.add')}
        </Button>
      </div>

      {categories.isPending && (
        <p role="status" className="mt-6 text-sm text-muted-foreground">
          {t('common.loading')}
        </p>
      )}
      {categories.isError && (
        <p role="alert" className="mt-6 text-sm text-destructive">
          {t('categories.loadFailed', { message: errorText(categories.error) })}
        </p>
      )}

      {categories.data &&
        transactionTypeSchema.options.map((type) => {
          const items = categories.data.filter((category) => category.type === type)
          return (
            <section key={type} className="mt-8">
              <h3 className="text-sm font-medium text-muted-foreground">{t(SECTION_TITLES[type])}</h3>
              {items.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">{t('categories.noneYet')}</p>
              ) : (
                <ul className="mt-2 divide-y rounded-xl border">
                  {items.map((category) => (
                    <li key={category.id} className="flex items-center gap-3 px-4 py-2.5">
                      <CategoryDot color={category.color} />
                      <span className="min-w-0 flex-1 truncate font-medium">{category.name}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {t('categories.transactionCount', { count: category.transactionCount })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('categories.editLabel', { name: category.name })}
                        onClick={() => setEditing({ category })}
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={t('categories.deleteLabel', { name: category.name })}
                        title={
                          category.transactionCount > 0
                            ? t('categories.inUse')
                            : undefined
                        }
                        disabled={category.transactionCount > 0}
                        onClick={() => setDeleting(category)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}

      <CategoryDialog
        open={editing !== null}
        category={editing?.category ?? null}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={t('categories.deleteTitle', { name: deleting?.name ?? '' })}
        description={t('common.cannotUndo')}
        confirmLabel={t('common.delete')}
        pending={remove.isPending}
        error={errorText(remove.error)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: closeDelete })}
        onClose={closeDelete}
      />
    </section>
  )
}
