import type { en } from './locales/en'

// Types t() keys and interpolation values against the English resources.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof en }
  }
}
