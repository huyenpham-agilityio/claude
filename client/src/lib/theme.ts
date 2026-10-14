import { useEffect, useState } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'
export type Theme = 'light' | 'dark'

// index.html reads the same key before the app loads.
const STORAGE_KEY = 'theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

export const THEME_ORDER: ThemePreference[] = ['system', 'light', 'dark']

function systemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

export function resolveTheme(preference: ThemePreference): Theme {
  return preference === 'system' ? systemTheme() : preference
}

// Storage can be unavailable (private mode, blocked site data); fall back to
// following the system.
export function readPreference(): ThemePreference {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'system'
  } catch {
    return 'system'
  }
}

function savePreference(preference: ThemePreference) {
  try {
    if (preference === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, preference)
  } catch {
    // Not remembered, but still applied for this visit.
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

// The user's theme choice, applied to the page and remembered. While set to
// "system" it follows the operating system as that changes.
export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readPreference)

  useEffect(() => {
    applyTheme(resolveTheme(preference))
    if (preference !== 'system') return

    const query = window.matchMedia(DARK_QUERY)
    const follow = () => applyTheme(systemTheme())
    query.addEventListener('change', follow)
    return () => query.removeEventListener('change', follow)
  }, [preference])

  const choose = (next: ThemePreference) => {
    savePreference(next)
    setPreference(next)
  }

  return [preference, choose] as const
}
