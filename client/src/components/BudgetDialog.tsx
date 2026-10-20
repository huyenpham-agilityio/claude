import { type Budget, type Category, amountSchema, msg } from '@expenses/shared'
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
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { useCurrency } from '@/lib/auth'
import { useSaveBudget } from '@/lib/budgets'
import { formatMonth } from '@/lib/dates'
import { useErrorText } from '@/lib/errors'
import { parseAmountInput, toAmountInput } from '@/lib/money'

function formSchema(currency: string) {
  return z.object({
    categoryId: z.string().min(1, msg('categoryRequired')),
    limitAmount: z
      .string()
      .transform((text) => parseAmountInput(text, currency))
      .pipe(amountSchema),
  })
}

type FormSchema = ReturnType<typeof formSchema>

interface BudgetDialogProps {
  open: boolean
  month: string
  // The budget being edited, or null to set a new one.
  budget: Budget | null
  // Expense categories that do not have a budget this month yet.
  availableCategories: Category[]
  onClose: () => void
}

export function BudgetDialog({ open, ...formProps }: BudgetDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={(next) => !next && formProps.onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formProps.budget ? t('budgets.edit') : t('budgets.set')}</DialogTitle>
          <DialogDescription>
            {t('budgets.dialogDescription', { month: formatMonth(formProps.month) })}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts from fresh values. */}
        <BudgetForm {...formProps} />
      </DialogContent>
    </Dialog>
  )
}

function BudgetForm({
  month,
  budget,
  availableCategories,
  onClose,
}: Omit<BudgetDialogProps, 'open'>) {
  const currency = useCurrency()
  const save = useSaveBudget()
  const { t } = useTranslation()
  const errorText = useErrorText()
  // A budget's category is fixed; to move it, delete it and set a new one.
  const options = budget ? [budget.category] : availableCategories

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.input<FormSchema>, unknown, z.output<FormSchema>>({
    resolver: zodResolver(formSchema(currency)),
    defaultValues: budget
      ? { categoryId: budget.category.id, limitAmount: toAmountInput(budget.limitAmount, currency) }
      : { categoryId: options[0]?.id ?? '', limitAmount: '' },
  })

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={handleSubmit(({ categoryId, limitAmount }) =>
        save.mutate({ categoryId, month, limitAmount }, { onSuccess: onClose }),
      )}
    >
      <FormField id="categoryId" label={t('common.category')} error={errors.categoryId?.message}>
        <NativeSelect
          id="categoryId"
          className="w-full"
          disabled={!!budget}
          aria-invalid={!!errors.categoryId}
          aria-describedby={errors.categoryId ? 'categoryId-error' : undefined}
          {...register('categoryId')}
        >
          {options.map((category) => (
            <NativeSelectOption key={category.id} value={category.id}>
              {category.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>

      <FormField
        id="limitAmount"
        label={t('budgets.monthlyLimit', { currency })}
        error={errors.limitAmount?.message}
      >
        <Input
          id="limitAmount"
          inputMode="decimal"
          autoComplete="off"
          autoFocus
          aria-invalid={!!errors.limitAmount}
          aria-describedby={errors.limitAmount ? 'limitAmount-error' : undefined}
          {...register('limitAmount')}
        />
      </FormField>

      {save.error && (
        <p role="alert" className="text-sm text-destructive">
          {errorText(save.error)}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {budget ? t('common.saveChanges') : t('budgets.set')}
        </Button>
      </DialogFooter>
    </form>
  )
}
