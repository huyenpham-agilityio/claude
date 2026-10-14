import { type Category, transactionTypeSchema } from '@expenses/shared'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { CategoryDialog } from '@/components/CategoryDialog'
import { CategoryDot } from '@/components/CategoryDot'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { useCategories, useDeleteCategory } from '@/lib/categories'

const SECTION_TITLES = { expense: 'Expense categories', income: 'Income categories' } as const

type Editing = { category: Category | null } | null

export function Categories() {
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
        <h2 className="text-2xl font-semibold">Categories</h2>
        <Button onClick={() => setEditing({ category: null })}>
          <Plus aria-hidden="true" /> Add category
        </Button>
      </div>

      {categories.isPending && (
        <p role="status" className="mt-6 text-sm text-muted-foreground">
          Loading…
        </p>
      )}
      {categories.isError && (
        <p role="alert" className="mt-6 text-sm text-destructive">
          Could not load categories. {categories.error.message}
        </p>
      )}

      {categories.data &&
        transactionTypeSchema.options.map((type) => {
          const items = categories.data.filter((category) => category.type === type)
          return (
            <section key={type} className="mt-8">
              <h3 className="text-sm font-medium text-muted-foreground">{SECTION_TITLES[type]}</h3>
              {items.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">None yet.</p>
              ) : (
                <ul className="mt-2 divide-y rounded-xl border">
                  {items.map((category) => (
                    <li key={category.id} className="flex items-center gap-3 px-4 py-2.5">
                      <CategoryDot color={category.color} />
                      <span className="min-w-0 flex-1 truncate font-medium">{category.name}</span>
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {category.transactionCount === 1
                          ? '1 transaction'
                          : `${category.transactionCount} transactions`}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${category.name}`}
                        onClick={() => setEditing({ category })}
                      >
                        <Pencil aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${category.name}`}
                        title={
                          category.transactionCount > 0
                            ? 'Move or delete its transactions first'
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
        title={`Delete ${deleting?.name ?? 'category'}?`}
        description="This cannot be undone."
        confirmLabel="Delete"
        pending={remove.isPending}
        error={remove.error?.message ?? null}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: closeDelete })}
        onClose={closeDelete}
      />
    </section>
  )
}
