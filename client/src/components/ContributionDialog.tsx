import { type Goal, amountSchema, msg } from '@expenses/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCurrency } from '@/lib/auth'
import { useErrorText } from '@/lib/errors'
import { useContribute } from '@/lib/goals'
import { formatMoney, parseAmountInput } from '@/lib/money'

export type ContributionDirection = 'add' | 'withdraw'

interface ContributionDialogProps {
  open: boolean
  goal: Goal | null
  direction: ContributionDirection
  onClose: () => void
}

export function ContributionDialog({ open, goal, direction, onClose }: ContributionDialogProps) {
  const currency = useCurrency()
  const { t } = useTranslation()
  const name = goal?.name ?? ''

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {direction === 'add' ? t('savings.addMoneyTo', { name }) : t('savings.takeMoneyFrom', { name })}
          </DialogTitle>
          <DialogDescription>
            {goal && t('savings.savedSoFar', { amount: formatMoney(goal.savedAmount, currency) })}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts empty. */}
        {goal && <ContributionForm goal={goal} direction={direction} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function ContributionForm({
  goal,
  direction,
  onClose,
}: {
  goal: Goal
  direction: ContributionDirection
  onClose: () => void
}) {
  const currency = useCurrency()
  const contribute = useContribute()
  const { t } = useTranslation()
  const errorText = useErrorText()
  const saved = formatMoney(goal.savedAmount, currency)

  const schema = z.object({
    amount: z
      .string()
      .transform((text) => parseAmountInput(text, currency))
      .pipe(amountSchema)
      .refine(
        (amount) => direction === 'add' || amount <= goal.savedAmount,
        msg('savedExceeded'),
      ),
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<typeof schema>, unknown, z.output<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { amount: '' },
  })

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={handleSubmit(({ amount }) =>
        contribute.mutate(
          { id: goal.id, amount: direction === 'add' ? amount : -amount },
          { onSuccess: onClose },
        ),
      )}
    >
      <FormField
        id="amount"
        label={t('common.amountIn', { currency })}
        error={errors.amount?.message}
        errorValues={{ amount: saved }}
      >
        <Input
          id="amount"
          inputMode="decimal"
          autoComplete="off"
          autoFocus
          aria-invalid={!!errors.amount}
          aria-describedby={errors.amount ? 'amount-error' : undefined}
          {...register('amount')}
        />
      </FormField>

      {contribute.error && (
        <p role="alert" className="text-sm text-destructive">
          {errorText(contribute.error)}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={contribute.isPending}>
          {direction === 'add' ? t('savings.addMoney') : t('savings.takeOut')}
        </Button>
      </DialogFooter>
    </form>
  )
}
