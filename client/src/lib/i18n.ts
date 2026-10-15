import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from '@/locales/en'
import { vi } from '@/locales/vi'
import { applyLanguage, readLanguage } from './language.ts'

const language = readLanguage()

// Both languages are bundled and set up synchronously, so the first render is
// already in the right language.
void i18next.use(initReactI18next).init({
  lng: language,
  fallbackLng: 'en',
  supportedLngs: ['en', 'vi'],
  resources: { en: { translation: en }, vi: { translation: vi } },
  initAsync: false,
  // React escapes text already.
  interpolation: { escapeValue: false },
})

applyLanguage(language)
