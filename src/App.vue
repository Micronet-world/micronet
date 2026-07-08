<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'
import { provideKernel, useKernelBridge, KeyboardView, type KernelAPI } from '@micronet/kernel'
import { getAllAppComponents } from '@micronet/sdk'
import { createKernelAPI } from './kernel-setup'

const kernel: KernelAPI = createKernelAPI()
const app = getCurrentInstance()!.appContext.app
provideKernel(app, kernel)

const { currentScreen, currentPlugin } = useKernelBridge()

const activeComponent = computed(() => {
  if (!currentPlugin.value) return null
  const id = currentScreen.value
  return getAllAppComponents()[id] || null
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
