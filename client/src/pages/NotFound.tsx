import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

export function NotFound() {
  const { t } = useTranslation()
  return (
    <section>
      <h2 className="text-2xl font-semibold">{t('notFound.title')}</h2>
      <Button asChild className="mt-4">
        <Link to="/">{t('notFound.backHome')}</Link>
      </Button>
    </section>
  )
}
