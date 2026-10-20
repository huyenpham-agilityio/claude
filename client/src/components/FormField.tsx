import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { useValidationText } from '@/lib/errors'

interface FormFieldProps {
  id: string
  label: string
  error?: string
  // Values for placeholders in a validation message, e.g. { amount }.
  errorValues?: Record<string, string>
  children: ReactNode
}

// A labelled control with its validation message. The control should set
// aria-describedby to `${id}-error` when `error` is present.
export function FormField({ id, label, error, errorValues, children }: FormFieldProps) {
  const validationText = useValidationText()
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {validationText(error, errorValues)}
        </p>
      )}
    </div>
  )
}
