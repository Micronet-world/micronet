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
      case 'home': {
        cardsExpanded.value = false
        // Navigate to the home screen wherever it sits in the stack. Home is
        // not always at index 1 — e.g. the camera can be pushed straight from
        // the lock screen (stack ['lock', 'camera']), so we can't rely on a
        // fixed slice length. If home isn't present, drop everything above lock
        // and reveal home.
        const homeIdx = screenStack.value.indexOf('home')
        if (homeIdx >= 0) {
          if (screenStack.value.length > homeIdx + 1) {
            screenStack.value = screenStack.value.slice(0, homeIdx + 1)
          }
        } else if (screenStack.value[0] === 'lock') {
          screenStack.value = ['lock', 'home']
        }
        break
      }
      case 'back': {
        cardsExpanded.value = false
        // Pop the top screen, but never pop home (or below). The previous
        // `length > 2` guard assumed home was always at index 1, which broke
        // stacks like ['lock', 'camera'] (camera opened from lock) — leaving
        // the app impossible to close. Pop whenever there's a screen above
        // home/lock to remove.
        const top = screenStack.value[screenStack.value.length - 1]
        if (screenStack.value.length > 1 && top !== 'home' && top !== 'lock') {
          screenStack.value = screenStack.value.slice(0, -1)
        }
        break
      }
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
