import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/theme'

// Switches between light and dark. Until the user picks one, the page follows
// the device; every press changes what is on screen.
export function ThemeToggle() {
  const { theme, setPreference } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  const description = `Switch to ${next} theme`
  const Icon = next === 'dark' ? Moon : Sun

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={description}
      title={description}
      onClick={() => setPreference(next)}
    >
      <Icon aria-hidden="true" />
    </Button>
  )
}
