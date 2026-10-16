import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconButton } from '@/components/IconButton'
import { useTheme } from '@/lib/theme'

// Switches between light and dark. Until the user picks one, the page follows
// the device; every press changes what is on screen.
export function ThemeToggle() {
  const { theme, setPreference } = useTheme()
  const { t } = useTranslation()
  const next = theme === 'dark' ? 'light' : 'dark'
  const description = next === 'dark' ? t('theme.switchToDark') : t('theme.switchToLight')
  const Icon = next === 'dark' ? Moon : Sun

  return (
    <IconButton
      variant="ghost"
      size="icon-sm"
      aria-label={description}
      tooltip={description}
      onClick={() => setPreference(next)}
    >
      <Icon aria-hidden="true" />
    </IconButton>
  )
}
