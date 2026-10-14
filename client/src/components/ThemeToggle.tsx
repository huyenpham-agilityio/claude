import { Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { THEME_ORDER, type ThemePreference, useTheme } from '@/lib/theme'

const THEMES: Record<ThemePreference, { label: string; Icon: typeof Sun }> = {
  system: { label: 'System', Icon: Monitor },
  light: { label: 'Light', Icon: Sun },
  dark: { label: 'Dark', Icon: Moon },
}

// One button that steps through System, Light, and Dark. Its label says both
// the current theme and what a press will switch to.
export function ThemeToggle() {
  const [preference, choose] = useTheme()
  const next = THEME_ORDER[(THEME_ORDER.indexOf(preference) + 1) % THEME_ORDER.length]!
  const { label, Icon } = THEMES[preference]
  const description = `Theme: ${label}. Switch to ${THEMES[next].label}`

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={description}
      title={description}
      onClick={() => choose(next)}
    >
      <Icon aria-hidden="true" />
    </Button>
  )
}
