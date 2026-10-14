import { type Goal, amountSchema } from '@expenses/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
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

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {direction === 'add' ? 'Add money to' : 'Take money from'} {goal?.name}
          </DialogTitle>
          <DialogDescription>
            {goal && `${formatMoney(goal.savedAmount, currency)} saved so far.`}
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

  const schema = z.object({
    amount: z
      .string()
      .transform((text) => parseAmountInput(text, currency))
      .pipe(amountSchema)
      .refine(
        (amount) => direction === 'add' || amount <= goal.savedAmount,
        `Only ${formatMoney(goal.savedAmount, currency)} is saved`,
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
      <FormField id="amount" label={`Amount (${currency})`} error={errors.amount?.message}>
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
          {contribute.error.message}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={contribute.isPending}>
          {direction === 'add' ? 'Add money' : 'Take out'}
        </Button>
      </DialogFooter>
    </form>
  )
}
