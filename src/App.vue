<script setup lang="ts">
import { computed } from 'vue'
import {
  provideKernel,
  useKernelBridge,
  useNavigation as kernelUseNavigation,
  registerScreen as kernelRegisterScreen,
  getRegisteredScreen,
  getRegisteredScreens,
  resetRegistry,
  onNav,
  resetBus,
  registerScreenComponents,
  getScreenComponent,
  KeyboardView,
  type KernelAPI,
} from '@micronet/kernel'
import { getAllAppComponents } from '@micronet/sdk'
import { registerApps } from '@micronet/apps'
import { getCurrentInstance } from 'vue'

const kernel: KernelAPI = {
  useNavigation: kernelUseNavigation,
  registerScreen: kernelRegisterScreen,
  getRegisteredScreen,
  getRegisteredScreens,
  resetRegistry,
  onNav,
  resetBus,
  registerScreenComponents,
}

const app = getCurrentInstance()!.appContext.app
provideKernel(app, kernel)

registerApps(kernel)

const { currentScreen, currentPlugin } = useKernelBridge()

const activeComponent = computed(() => {
  if (!currentPlugin.value) return null
  const id = currentScreen.value
  return getScreenComponent(id as any) || getAllAppComponents()[id] || null
})
</script>

<template>
  <div class="app-container">
    <Transition name="slide-up">
      <component
        v-if="activeComponent"
        :is="activeComponent"
        :key="currentScreen"
      />
    </Transition>
    <KeyboardView />
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
