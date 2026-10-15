import {
  CATEGORY_COLORS,
  type Category,
  categoryCreateSchema,
  transactionTypeSchema,
} from '@expenses/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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
import { useCreateCategory, useUpdateCategory } from '@/lib/categories'
import { useErrorText } from '@/lib/errors'

const TYPE_LABELS = { expense: 'types.expense', income: 'types.income' } as const

interface CategoryDialogProps {
  open: boolean
  // The category being edited, or null to add a new one.
  category: Category | null
  onClose: () => void
}

export function CategoryDialog({ open, ...formProps }: CategoryDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={(next) => !next && formProps.onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{formProps.category ? t('categories.edit') : t('categories.add')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('categories.dialogDescription')}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so each opening starts from fresh values. */}
        <CategoryForm {...formProps} />
      </DialogContent>
    </Dialog>
  )
}

function CategoryForm({ category, onClose }: Omit<CategoryDialogProps, 'open'>) {
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const save = category ? update : create
  const { t } = useTranslation()
  const errorText = useErrorText()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: category
      ? { name: category.name, type: category.type, color: category.color }
      : { name: '', type: 'expense' as const, color: CATEGORY_COLORS[0] as string },
  })

  // Keep an edited category's own colour selectable even if it is not a preset.
  const colors: string[] =
    category && !CATEGORY_COLORS.some((color) => color === category.color)
      ? [category.color, ...CATEGORY_COLORS]
      : [...CATEGORY_COLORS]

  return (
    <form
      noValidate
      className="grid gap-4"
      onSubmit={handleSubmit(({ name, type, color }) =>
        category
          ? update.mutate({ id: category.id, name, color }, { onSuccess: onClose })
          : create.mutate({ name, type, color }, { onSuccess: onClose }),
      )}
    >
      <FormField id="name" label={t('common.name')} error={errors.name?.message}>
        <Input
          id="name"
          autoComplete="off"
          autoFocus
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          {...register('name')}
        />
      </FormField>

      <FormField id="type" label={t('common.type')}>
        {/* The type is fixed after creation so existing transactions stay consistent. */}
        <NativeSelect id="type" className="w-full" disabled={!!category} {...register('type')}>
          {transactionTypeSchema.options.map((option) => (
            <NativeSelectOption key={option} value={option}>
              {t(TYPE_LABELS[option])}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">{t('categories.colour')}</legend>
        <div className="flex flex-wrap gap-2">
          {colors.map((color, index) => (
            <label key={color} className="cursor-pointer">
              <input
                type="radio"
                value={color}
                aria-label={t('categories.colourOption', { number: index + 1 })}
                className="peer sr-only"
                {...register('color')}
              />
              <span
                className="block size-7 rounded-full ring-offset-2 ring-offset-background peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring"
                style={{ backgroundColor: color }}
              />
            </label>
          ))}
        </div>
      </fieldset>

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
          {category ? t('common.saveChanges') : t('categories.add')}
        </Button>
      </DialogFooter>
    </form>
  )
}
