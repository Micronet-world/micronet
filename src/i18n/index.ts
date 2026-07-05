import { createI18n } from 'vue-i18n'
import en from './locales/en'
import zh from './locales/zh'

type AppLocale = 'en' | 'zh'

function detectLocale(): AppLocale {
  const saved = localStorage.getItem('micronet-locale')
  if (saved === 'en' || saved === 'zh') return saved

  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('zh')) return 'zh'
  return 'en'
}

const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: 'en',
  messages: {
    en,
    zh,
  },
})

export default i18n

export function setLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
  localStorage.setItem('micronet-locale', locale)
}

export function getLocale(): AppLocale {
  return i18n.global.locale.value as AppLocale
}
