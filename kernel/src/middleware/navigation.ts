import type { ScreenId } from './types'
import { emitNav } from './bus'

export function useNavigation() {
  return {
    goTo(screen: ScreenId) { emitNav({ action: 'push', screen }) },
    goBack() { emitNav({ action: 'back' }) },
    goHome() { emitNav({ action: 'home' }) },
    lock() { emitNav({ action: 'lock' }) },
    navigate(screen: ScreenId) { emitNav({ action: 'navigate', screen }) },
  }
}
