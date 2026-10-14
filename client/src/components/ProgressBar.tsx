import type { BudgetStatus } from '@expenses/shared'

const FILL_CLASSES: Record<BudgetStatus, string> = {
  ok: 'bg-primary',
  warning: 'bg-amber-500',
  over: 'bg-destructive',
}

interface ProgressBarProps {
  label: string
  value: number
  max: number
  status: BudgetStatus
}

// The bar fills up to its limit; anything beyond shows as a full bar.
export function ProgressBar({ label, value, max, status }: ProgressBarProps) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      className="h-2 overflow-hidden rounded-full bg-muted"
    >
      <div
        className={`h-full rounded-full ${FILL_CLASSES[status]}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
