import { type Locale, localeSchema } from '@expenses/shared'
import i18next from 'i18next'
import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'language'

// Shown in their own language, so each is readable whatever the app shows.
export const LANGUAGE_NAMES: Record<Locale, string> = { en: 'English', vi: 'Tiếng Việt' }

// Full locale tags for date and number formatting.
const LOCALE_TAGS: Record<Locale, string> = { en: 'en-US', vi: 'vi-VN' }

function detectLanguage(): Locale {
  const preferred = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase()
  return preferred.startsWith('vi') ? 'vi' : 'en'
}

// A saved choice wins; otherwise follow the browser. The detected language is
// not saved, so it keeps following the browser until the user picks one.
export function readLanguage(): Locale {
  try {
    const saved = localeSchema.safeParse(localStorage.getItem(STORAGE_KEY))
    if (saved.success) return saved.data
  } catch {
    // Storage can be unavailable (private mode, blocked site data).
  }
  return detectLanguage()
}

function saveLanguage(language: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, language)
  } catch {
    // Not remembered, but still applied for this visit.
  }
}

// Screen readers use the page language for pronunciation.
export function applyLanguage(language: Locale) {
  document.documentElement.lang = language
  document.title = i18next.t('app.title')
}

export function currentLanguage(): Locale {
  const parsed = localeSchema.safeParse(i18next.resolvedLanguage)
  return parsed.success ? parsed.data : 'en'
}

export function currentLocaleTag(): string {
  return LOCALE_TAGS[currentLanguage()]
}

// Orders names alphabetically for the language, so Vietnamese letters like
// Ă and Đ sit next to A and D rather than after Z.
export function compareNames(a: string, b: string, language: Locale): number {
  return a.localeCompare(b, LOCALE_TAGS[language])
}

// One shared store, so every component and every open tab agree.
let language: Locale = readLanguage()
const listeners = new Set<() => void>()

function update(next: Locale) {
  language = next
  // Synchronous: both languages are bundled, so nothing loads.
  void i18next.changeLanguage(next)
  applyLanguage(next)
  for (const listener of listeners) listener()
}

// Another tab changed the saved language.
function onStorage(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return
  const next = readLanguage()
  if (next !== language) update(next)
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    // Catch up on anything that changed while nothing was listening.
    const saved = readLanguage()
    if (saved !== language) update(saved)
    window.addEventListener('storage', onStorage)
  }
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('storage', onStorage)
  }
}

export function setLanguage(next: Locale) {
  saveLanguage(next)
  update(next)
}

export function useLanguage() {
  const current = useSyncExternalStore(subscribe, () => language)
  return { language: current, setLanguage }
}
