import type { Goal } from '@expenses/shared'
import { Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { type ContributionDirection, ContributionDialog } from '@/components/ContributionDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { GoalDialog } from '@/components/GoalDialog'
import { GoalProgress } from '@/components/GoalProgress'
import { IconButton } from '@/components/IconButton'
import { Button } from '@/components/ui/button'
import { useErrorText } from '@/lib/errors'
import { useDeleteGoal, useGoals } from '@/lib/goals'

type Editing = { goal: Goal | null } | null
type Contributing = { goal: Goal; direction: ContributionDirection } | null

export function Savings() {
  const { t } = useTranslation()
  const errorText = useErrorText()
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
        <h2 className="text-2xl font-semibold">{t('savings.title')}</h2>
        <Button onClick={() => setEditing({ goal: null })}>
          <Plus aria-hidden="true" /> {t('savings.newGoal')}
        </Button>
      </div>

      <div className="mt-6">
        {goals.isPending && (
          <p role="status" className="text-sm text-muted-foreground">
            {t('common.loading')}
          </p>
        )}
        {goals.isError && (
          <p role="alert" className="text-sm text-destructive">
            {t('savings.loadFailed', { message: errorText(goals.error) })}
          </p>
        )}
        {goals.data?.length === 0 && (
          <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
            {t('savings.empty')}
          </p>
        )}

        {goals.data && goals.data.length > 0 && (
          <ul className="grid gap-4">
            {goals.data.map((goal) => (
              <li key={goal.id} className="rounded-xl border px-4 py-3">
                <div className="flex items-center gap-2">
                  <h3 className="min-w-0 flex-1 truncate font-medium">{goal.name}</h3>
                  <IconButton
                    variant="ghost"
                    size="icon-sm"
                    tooltip={t('tooltips.editGoal')}
                    aria-label={t('savings.editLabel', { name: goal.name })}
                    onClick={() => setEditing({ goal })}
                  >
                    <Pencil aria-hidden="true" />
                  </IconButton>
                  <IconButton
                    variant="ghost"
                    size="icon-sm"
                    tooltip={t('tooltips.deleteGoal')}
                    aria-label={t('savings.deleteLabel', { name: goal.name })}
                    onClick={() => setDeleting(goal)}
                  >
                    <Trash2 aria-hidden="true" />
                  </IconButton>
                </div>
                <div className="mt-2">
                  <GoalProgress goal={goal} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    aria-label={t('savings.addMoneyLabel', { name: goal.name })}
                    onClick={() => setContributing({ goal, direction: 'add' })}
                  >
                    <Plus aria-hidden="true" /> {t('savings.addMoney')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    aria-label={t('savings.takeMoneyLabel', { name: goal.name })}
                    disabled={goal.savedAmount === 0}
                    onClick={() => setContributing({ goal, direction: 'withdraw' })}
                  >
                    <Minus aria-hidden="true" /> {t('savings.takeOut')}
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
        title={t('savings.deleteTitle', { name: deleting?.name ?? '' })}
        description={t('savings.deleteDescription')}
        confirmLabel={t('common.delete')}
        pending={remove.isPending}
        error={errorText(remove.error)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: closeDelete })}
        onClose={closeDelete}
      />
    </section>
  )
}
