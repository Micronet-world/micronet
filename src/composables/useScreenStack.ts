import { ref, computed } from 'vue'
import type { ScreenId, NavIntent } from '../screens/types'

export function useScreenStack() {
  const screenStack = ref<ScreenId[]>(['lock'])
  const currentScreen = computed(() => screenStack.value[screenStack.value.length - 1])
  const cardsExpanded = ref(false)

  function dispatch(intent: NavIntent) {
    switch (intent.type) {
      case 'push':
        cardsExpanded.value = false
        screenStack.value = [...screenStack.value, intent.screen]
        break
      case 'lock':
        cardsExpanded.value = false
        screenStack.value = ['lock']
        break
      case 'home':
        cardsExpanded.value = false
        if (screenStack.value.length > 2) {
          screenStack.value = screenStack.value.slice(0, 2)
        }
        break
      case 'back':
        cardsExpanded.value = false
        if (screenStack.value.length > 2) {
          screenStack.value = screenStack.value.slice(0, -1)
        }
        break
      case 'navigate': {
        cardsExpanded.value = false
        const idx = screenStack.value.indexOf(intent.screen)
        if (idx >= 0) {
          screenStack.value = screenStack.value.slice(0, idx + 1)
        }
        break
      }
      case 'show-cards':
        cardsExpanded.value = true
        break
      case 'collapse':
        cardsExpanded.value = false
        break
    }
  }

  return { screenStack, currentScreen, cardsExpanded, dispatch }
}
