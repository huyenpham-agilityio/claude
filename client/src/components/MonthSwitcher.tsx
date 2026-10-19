import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/IconButton'
import { formatMonth, shiftMonth } from '@/lib/dates'

interface MonthSwitcherProps {
  month: string
  onChange: (month: string) => void
}

export function MonthSwitcher({ month, onChange }: MonthSwitcherProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between gap-2 sm:justify-start">
      <IconButton
        variant="outline"
        size="icon"
        aria-label={t('month.previous')}
        tooltip={t('month.previous')}
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeft aria-hidden="true" />
      </IconButton>
      <p className="min-w-40 text-center font-medium" aria-live="polite">
        {formatMonth(month)}
      </p>
      <IconButton
        variant="outline"
        size="icon"
        aria-label={t('month.next')}
        tooltip={t('month.next')}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight aria-hidden="true" />
      </IconButton>
    </div>
  )
}
