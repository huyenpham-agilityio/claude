import { Button } from '@/components/ui/button'
import { LANGUAGE_NAMES, useLanguage } from '@/lib/language'

// Shows the language a press switches to. Its name is in that language, and
// marked as such, so screen readers pronounce it correctly. The spoken name
// starts with the visible code, so voice control can match "VI" or "EN".
export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  const next = language === 'vi' ? 'en' : 'vi'
  const code = next.toUpperCase()
  const name = LANGUAGE_NAMES[next]

  return (
    <Button
      variant="ghost"
      size="sm"
      lang={next}
      aria-label={`${code}, ${name}`}
      title={name}
      onClick={() => setLanguage(next)}
    >
      {code}
    </Button>
  )
}
