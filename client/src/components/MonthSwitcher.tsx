import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { formatMonth, shiftMonth } from '@/lib/dates'

interface MonthSwitcherProps {
  month: string
  onChange: (month: string) => void
}

export function MonthSwitcher({ month, onChange }: MonthSwitcherProps) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between gap-2 sm:justify-start">
      <Button
        variant="outline"
        size="icon"
        aria-label={t('month.previous')}
        onClick={() => onChange(shiftMonth(month, -1))}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <p className="min-w-40 text-center font-medium" aria-live="polite">
        {formatMonth(month)}
      </p>
      <Button
        variant="outline"
        size="icon"
        aria-label={t('month.next')}
        onClick={() => onChange(shiftMonth(month, 1))}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  )
}
