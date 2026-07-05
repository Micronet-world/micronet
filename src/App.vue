<script setup lang="ts">
import { computed } from 'vue'
import { useScreenStack } from './composables/useScreenStack'
import { getScreenPlugin } from './screens/registry'

const { currentScreen, dispatch } = useScreenStack()

const currentPlugin = computed(() => getScreenPlugin(currentScreen.value))

// Each screen declares its emit-name → navigation-intent mapping in the
// registry; bind them all so App.vue never needs a per-screen v-if branch.
const screenListeners = computed(() => {
  const listeners: Record<string, () => void> = {}
  for (const [eventName, intent] of Object.entries(currentPlugin.value.events)) {
    listeners[eventName] = () => dispatch(intent)
  }
  return listeners
})
</script>

<template>
  <div class="app-container">
    <Transition name="slide-up">
      <component :is="currentPlugin.component" :key="currentScreen" v-on="screenListeners" />
    </Transition>
  </div>
</template>

<style scoped>
.app-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.slide-up-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-leave-active {
  transition: all 0.3s ease-in;
  position: absolute;
  inset: 0;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-30%);
  opacity: 0;
}
</style>
