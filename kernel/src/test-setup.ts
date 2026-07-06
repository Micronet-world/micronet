import { createI18n } from 'vue-i18n'
import en from './i18n/locales/en'
import zh from './i18n/locales/zh'
import { setKernel } from './injection'
import { useNavigation } from './middleware/navigation'
import { registerScreen, getRegisteredScreen, getRegisteredScreens, resetRegistry } from './middleware/registry'
import { onNav, resetBus } from './middleware/bus'
import { registerScreenComponents } from './middleware/screens'
import type { KernelAPI } from './injection'

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    en,
    zh,
  },
})

const kernel: KernelAPI = {
  useNavigation,
  registerScreen,
  getRegisteredScreen,
  getRegisteredScreens,
  resetRegistry,
  onNav,
  resetBus,
  registerScreenComponents,
}

setKernel(kernel)
