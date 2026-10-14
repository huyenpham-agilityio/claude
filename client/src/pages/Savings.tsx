import type { Goal } from '@expenses/shared'
import { Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { type ContributionDirection, ContributionDialog } from '@/components/ContributionDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { GoalDialog } from '@/components/GoalDialog'
import { GoalProgress } from '@/components/GoalProgress'
import { Button } from '@/components/ui/button'
import { useDeleteGoal, useGoals } from '@/lib/goals'

type Editing = { goal: Goal | null } | null
type Contributing = { goal: Goal; direction: ContributionDirection } | null

export function Savings() {
  const goals = useGoals()
  const remove = useDeleteGoal()
  const [editing, setEditing] = useState<Editing>(null)
  const [contributing, setContributing] = useState<Contributing>(null)
  const [deleting, setDeleting] = useState<Goal | null>(null)

  const closeDelete = () => {
    setDeleting(null)
    remove.reset()
  }

  return (
    <section>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold">Savings goals</h2>
        <Button onClick={() => setEditing({ goal: null })}>
          <Plus aria-hidden="true" /> New goal
        </Button>
      </div>

      <div className="mt-6">
        {goals.isPending && (
          <p role="status" className="text-sm text-muted-foreground">
            Loading…
          </p>
        )}
        {goals.isError && (
          <p role="alert" className="text-sm text-destructive">
            Could not load savings goals. {goals.error.message}
          </p>
        )}
        {goals.data?.length === 0 && (
          <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            No savings goals yet. Create one for something you are saving towards, like a trip or
            an emergency fund.
          </p>
        )}

        {goals.data && goals.data.length > 0 && (
          <ul className="grid gap-4">
            {goals.data.map((goal) => (
              <li key={goal.id} className="rounded-xl border px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="min-w-0 flex-1 truncate font-medium">{goal.name}</h3>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Edit ${goal.name}`}
                    onClick={() => setEditing({ goal })}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${goal.name}`}
                    onClick={() => setDeleting(goal)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
                <div className="mt-2">
                  <GoalProgress goal={goal} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    aria-label={`Add money to ${goal.name}`}
                    onClick={() => setContributing({ goal, direction: 'add' })}
                  >
                    <Plus aria-hidden="true" /> Add money
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={`Take money from ${goal.name}`}
                    disabled={goal.savedAmount === 0}
                    onClick={() => setContributing({ goal, direction: 'withdraw' })}
                  >
                    <Minus aria-hidden="true" /> Take out
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <GoalDialog
        open={editing !== null}
        goal={editing?.goal ?? null}
        onClose={() => setEditing(null)}
      />
      <ContributionDialog
        open={contributing !== null}
        goal={contributing?.goal ?? null}
        direction={contributing?.direction ?? 'add'}
        onClose={() => setContributing(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? 'goal'}?`}
        description="The goal and its saved amount are removed. This cannot be undone."
        confirmLabel="Delete"
        pending={remove.isPending}
        error={remove.error?.message ?? null}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: closeDelete })}
        onClose={closeDelete}
      />
    </section>
  )
}
