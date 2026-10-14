import { useSyncExternalStore } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'
export type Theme = 'light' | 'dark'

// index.html's pre-paint script uses the same key, query, and colours; a test
// runs that script to keep them in step.
export const STORAGE_KEY = 'theme'
export const DARK_QUERY = '(prefers-color-scheme: dark)'
// Browser chrome colour for each theme (the page background).
export const THEME_COLORS: Record<Theme, string> = { light: '#ffffff', dark: '#0a0a0a' }

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
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute(
    'content',
    THEME_COLORS[theme],
  )
}

interface ThemeState {
  preference: ThemePreference
  // What the preference currently resolves to; changes with the operating
  // system while the preference is "system".
  theme: Theme
}

function stateFor(preference: ThemePreference): ThemeState {
  return { preference, theme: resolveTheme(preference) }
}

// One shared store, so every component and every open tab agree on the
// preference. While it is "system", the page follows the operating system.
let state: ThemeState = stateFor(readPreference())
const listeners = new Set<() => void>()

function update(next: ThemePreference) {
  state = stateFor(next)
  applyTheme(state.theme)
  for (const listener of listeners) listener()
}

// Another tab changed the saved preference.
function onStorage(event: StorageEvent) {
  if (event.key === STORAGE_KEY || event.key === null) update(readPreference())
}

// The operating system switched between light and dark.
function onSystemChange() {
  if (state.preference === 'system') update('system')
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    // Catch up on anything that changed while nothing was listening.
    state = stateFor(readPreference())
    applyTheme(state.theme)
    window.addEventListener('storage', onStorage)
    window.matchMedia(DARK_QUERY).addEventListener('change', onSystemChange)
  }
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
    if (listeners.size > 0) return
    window.removeEventListener('storage', onStorage)
    window.matchMedia(DARK_QUERY).removeEventListener('change', onSystemChange)
  }
}

export function setThemePreference(next: ThemePreference) {
  savePreference(next)
  update(next)
}

// The saved preference and the theme it currently resolves to.
export function useTheme() {
  const current = useSyncExternalStore(subscribe, () => state)
  return { ...current, setPreference: setThemePreference }
}
