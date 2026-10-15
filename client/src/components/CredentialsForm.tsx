import type { LoginInput } from '@expenses/shared'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useValidationText } from '@/lib/errors'

interface CredentialsFormProps {
  schema: z.ZodType<LoginInput, LoginInput>
  submitLabel: string
  passwordAutoComplete: 'current-password' | 'new-password'
  passwordHint?: string
  pending: boolean
  error: string | null
  onSubmit: (values: LoginInput) => void
}

export function CredentialsForm({
  schema,
  submitLabel,
  passwordAutoComplete,
  passwordHint,
  pending,
  error,
  onSubmit,
}: CredentialsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } })

  const { t } = useTranslation()
  const validationText = useValidationText()

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">{t('auth.email')}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {validationText(errors.email.message)}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">{t('auth.password')}</Label>
        <Input
          id="password"
          type="password"
          autoComplete={passwordAutoComplete}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : passwordHint && 'password-hint'}
          {...register('password')}
        />
        {errors.password ? (
          <p id="password-error" className="text-sm text-destructive">
            {validationText(errors.password.message)}
          </p>
        ) : (
          passwordHint && (
            <p id="password-hint" className="text-sm text-muted-foreground">
              {passwordHint}
            </p>
          )
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {submitLabel}
      </Button>
    </form>
  )
}
