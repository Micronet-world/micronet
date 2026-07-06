import { computed, onUnmounted } from 'vue'
import type { NavIntent } from './types'
import { useScreenStack } from '../composables/useScreenStack'
import { getRegisteredScreen } from './registry'
import { onNav } from './bus'

export function useKernelBridge() {
  const { screenStack, currentScreen, dispatch } = useScreenStack()

  const offNav = onNav((msg) => {
    const intent: NavIntent =
      msg.action === 'push' ? { type: 'push', screen: msg.screen! }
      : msg.action === 'navigate' ? { type: 'navigate', screen: msg.screen! }
      : { type: msg.action }
    dispatch(intent)
  })

  onUnmounted(() => { offNav() })

  const currentPlugin = computed(() => {
    const reg = getRegisteredScreen(currentScreen.value)
    return reg ?? null
  })

  return { screenStack, currentScreen, currentPlugin }
}
