import { type Goal, amountSchema, dateSchema } from '@expenses/shared'
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
import { useSaveGoal } from '@/lib/goals'
import { parseAmountInput, toAmountInput } from '@/lib/money'

function formSchema(currency: string) {
  return z.object({
    name: z.string().trim().min(1, 'Enter a name').max(60, 'Name must be at most 60 characters'),
    targetAmount: z
      .string()
      .transform((text) => parseAmountInput(text, currency))
      .pipe(amountSchema),
    // Optional: an empty date field means no deadline.
    targetDate: z.union([z.literal('').transform(() => null), dateSchema]),
  })
}

type FormSchema = ReturnType<typeof formSchema>

interface GoalDialogProps {
  open: boolean
  // The goal being edited, or null to create one.
  goal: Goal | null
  onClose: () => void
}

export function GoalDialog({ open, ...formProps }: GoalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && formProps.onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formProps.goal ? 'Edit goal' : 'New savings goal'}</DialogTitle>
          <DialogDescription className="sr-only">
            Name the goal and choose how much to save, and optionally by when.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts from fresh values. */}
        <GoalForm {...formProps} />
      </DialogContent>
    </Dialog>
  )
}

function GoalForm({ goal, onClose }: Omit<GoalDialogProps, 'open'>) {
  const currency = useCurrency()
  const save = useSaveGoal()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<FormSchema>, unknown, z.output<FormSchema>>({
    resolver: zodResolver(formSchema(currency)),
    defaultValues: goal
      ? {
          name: goal.name,
          targetAmount: toAmountInput(goal.targetAmount, currency),
          targetDate: goal.targetDate ?? '',
        }
      : { name: '', targetAmount: '', targetDate: '' },
  })

  const describedBy = (field: keyof typeof errors) => (errors[field] ? `${field}-error` : undefined)

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={handleSubmit((values) => save.mutate({ id: goal?.id, ...values }, { onSuccess: onClose }))}
    >
      <FormField id="name" label="Name" error={errors.name?.message}>
        <Input
          id="name"
          autoComplete="off"
          autoFocus
          aria-invalid={!!errors.name}
          aria-describedby={describedBy('name')}
          {...register('name')}
        />
      </FormField>

      <FormField id="targetAmount" label={`Target (${currency})`} error={errors.targetAmount?.message}>
        <Input
          id="targetAmount"
          inputMode="decimal"
          autoComplete="off"
          aria-invalid={!!errors.targetAmount}
          aria-describedby={describedBy('targetAmount')}
          {...register('targetAmount')}
        />
      </FormField>

      <FormField id="targetDate" label="Target date (optional)" error={errors.targetDate?.message}>
        <Input
          id="targetDate"
          type="date"
          aria-invalid={!!errors.targetDate}
          aria-describedby={describedBy('targetDate')}
          {...register('targetDate')}
        />
      </FormField>

      {save.error && (
        <p role="alert" className="text-sm text-destructive">
          {save.error.message}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {goal ? 'Save changes' : 'Create goal'}
        </Button>
      </DialogFooter>
    </form>
  )
}
