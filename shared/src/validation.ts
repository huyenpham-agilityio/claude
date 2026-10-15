// Validation messages travel as keys so the app can show them in the user's
// language; the server maps them back to this English text for its responses.
export const validationMessages = {
  emailInvalid: 'Enter a valid email address',
  passwordTooShort: 'Password must be at least 8 characters',
  passwordTooLong: 'Password must be at most 200 characters',
  passwordRequired: 'Enter your password',
  amountRequired: 'Enter an amount',
  amountWhole: 'Enter a whole amount',
  amountPositive: 'Amount must be greater than zero',
  amountNonZero: 'Amount must not be zero',
  amountTooLarge: 'Amount is too large',
  monthInvalid: 'Expected YYYY-MM',
  dateRequired: 'Enter a date',
  dateInvalid: 'Enter a real date',
  nameRequired: 'Enter a name',
  categoryNameTooLong: 'Name must be at most 40 characters',
  goalNameTooLong: 'Name must be at most 60 characters',
  colorRequired: 'Pick a colour',
  categoryRequired: 'Choose a category',
  noteTooLong: 'Note must be at most 200 characters',
  rangeReversed: 'Start must not be after end',
  rangeTooLong: 'Choose at most {{max}} months',
  savedExceeded: 'Only {{amount}} is saved',
} as const

export type ValidationKey = keyof typeof validationMessages

// Marks a schema message as a translation key.
export const msg = (key: ValidationKey) => key

export function isValidationKey(value: string): value is ValidationKey {
  return Object.hasOwn(validationMessages, value)
}

// Fills {{name}} placeholders, for the English text the server sends.
export function fillPlaceholders(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  )
}
