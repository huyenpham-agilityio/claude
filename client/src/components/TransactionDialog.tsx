import {
  type Category,
  type Transaction,
  amountSchema,
  dateSchema,
  transactionTypeSchema,
} from '@expenses/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
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
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { useCurrency } from '@/lib/auth'
import { today } from '@/lib/dates'
import { parseAmountInput, toAmountInput } from '@/lib/money'
import { useSaveTransaction } from '@/lib/transactions'

function formSchema(currency: string) {
  return z.object({
    type: transactionTypeSchema,
    categoryId: z.string().min(1, 'Choose a category'),
    amount: z
      .string()
      .transform((text) => parseAmountInput(text, currency))
      .pipe(amountSchema),
    date: dateSchema,
    note: z.string().max(200, 'Note must be at most 200 characters'),
  })
}

type FormSchema = ReturnType<typeof formSchema>

const TYPE_LABELS = { expense: 'Expense', income: 'Income' } as const

interface TransactionDialogProps {
  open: boolean
  // The transaction being edited, or null to add a new one.
  transaction: Transaction | null
  categories: Category[]
  onClose: () => void
}

export function TransactionDialog({ open, ...formProps }: TransactionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && formProps.onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formProps.transaction ? 'Edit transaction' : 'Add transaction'}</DialogTitle>
          <DialogDescription className="sr-only">
            Record an expense or income with its category, amount, and date.
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts from fresh values. */}
        <TransactionForm {...formProps} />
      </DialogContent>
    </Dialog>
  )
}

function TransactionForm({
  transaction,
  categories,
  onClose,
}: Omit<TransactionDialogProps, 'open'>) {
  const currency = useCurrency()
  const save = useSaveTransaction()
  const firstOfType = (type: Category['type']) =>
    categories.find((category) => category.type === type)?.id ?? ''

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<z.input<FormSchema>, unknown, z.output<FormSchema>>({
    resolver: zodResolver(formSchema(currency)),
    defaultValues: transaction
      ? {
          type: transaction.type,
          categoryId: transaction.category.id,
          amount: toAmountInput(transaction.amount, currency),
          date: transaction.date,
          note: transaction.note ?? '',
        }
      : { type: 'expense', categoryId: firstOfType('expense'), amount: '', date: today(), note: '' },
  })

  const type = useWatch({ control, name: 'type' })
  const options = categories.filter((category) => category.type === type)
  const describedBy = (field: keyof typeof errors) => (errors[field] ? `${field}-error` : undefined)

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={handleSubmit(({ categoryId, amount, date, note }) =>
        save.mutate(
          { id: transaction?.id, categoryId, amount, date, note: note.trim() || null },
          { onSuccess: onClose },
        ),
      )}
    >
      <div role="radiogroup" aria-label="Type" className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1">
        {transactionTypeSchema.options.map((option) => (
          <label key={option} className="cursor-pointer">
            <input
              type="radio"
              value={option}
              className="peer sr-only"
              {...register('type', {
                onChange: (event) => setValue('categoryId', firstOfType(event.target.value)),
              })}
            />
            <span className="block rounded-md px-3 py-1.5 text-center text-sm font-medium text-muted-foreground peer-checked:bg-background peer-checked:text-foreground peer-checked:shadow-sm peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50">
              {TYPE_LABELS[option]}
            </span>
          </label>
        ))}
      </div>

      <FormField id="amount" label={`Amount (${currency})`} error={errors.amount?.message}>
        <Input
          id="amount"
          inputMode="decimal"
          autoComplete="off"
          autoFocus
          aria-invalid={!!errors.amount}
          aria-describedby={describedBy('amount')}
          {...register('amount')}
        />
      </FormField>

      <FormField id="categoryId" label="Category" error={errors.categoryId?.message}>
        <NativeSelect
          id="categoryId"
          className="w-full"
          aria-invalid={!!errors.categoryId}
          aria-describedby={describedBy('categoryId')}
          {...register('categoryId')}
        >
          {options.length === 0 && (
            <NativeSelectOption value="">No {type} categories yet</NativeSelectOption>
          )}
          {options.map((category) => (
            <NativeSelectOption key={category.id} value={category.id}>
              {category.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>

      <FormField id="date" label="Date" error={errors.date?.message}>
        <Input
          id="date"
          type="date"
          aria-invalid={!!errors.date}
          aria-describedby={describedBy('date')}
          {...register('date')}
        />
      </FormField>

      <FormField id="note" label="Note (optional)" error={errors.note?.message}>
        <Input
          id="note"
          autoComplete="off"
          aria-invalid={!!errors.note}
          aria-describedby={describedBy('note')}
          {...register('note')}
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
          {transaction ? 'Save changes' : 'Add transaction'}
        </Button>
      </DialogFooter>
    </form>
  )
}
