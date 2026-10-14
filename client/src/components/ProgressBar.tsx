export type ProgressTone = 'default' | 'warning' | 'danger' | 'success'

const FILL_CLASSES: Record<ProgressTone, string> = {
  default: 'bg-primary',
  warning: 'bg-amber-500',
  danger: 'bg-destructive',
  success: 'bg-emerald-600',
}

interface ProgressBarProps {
  label: string
  value: number
  max: number
  tone?: ProgressTone
}

// The bar fills up to its maximum; anything beyond shows as a full bar.
export function ProgressBar({ label, value, max, tone = 'default' }: ProgressBarProps) {
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
      <div className={`h-full rounded-full ${FILL_CLASSES[tone]}`} style={{ width: `${percent}%` }} />
    </div>
  )
}
