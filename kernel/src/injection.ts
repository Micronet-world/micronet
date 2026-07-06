import type { Component, App as VueApp } from 'vue'
import { inject } from 'vue'
import type { ScreenId, ScreenMeta, NavIntent, ScreenRegistration, NavRequest } from './middleware/types'
import type { Photo, PhotoMetadata } from './composables/usePhotoStore'
import type { CalendarEvent } from './composables/useCalendarStore'
import type { BTDevice, BTCharacteristic } from './composables/useBluetooth'

export interface KernelAPI {
  useNavigation(): {
    goTo(screen: ScreenId): void
    goBack(): void
    goHome(): void
    lock(): void
    navigate(screen: ScreenId): void
  }
  registerScreen(meta: ScreenMeta, events: Record<string, NavIntent>): void
  getRegisteredScreen(id: ScreenId): ScreenRegistration | undefined
  getRegisteredScreens(): ScreenRegistration[]
  resetRegistry(): void
  onNav(handler: (msg: NavRequest) => void): () => void
  resetBus(): void
  registerScreenComponents(components: Record<string, Component>): void
}

const KERNEL_KEY = Symbol('@micronet/kernel')
let kernelInstance: KernelAPI | null = null

export function setKernel(kernel: KernelAPI): void {
  kernelInstance = kernel
}

export function getKernel(): KernelAPI {
  if (!kernelInstance) {
    throw new Error('[Micronet] Kernel not initialized. Call setKernel() before using SDK or Apps.')
  }
  return kernelInstance
}

export function provideKernel(app: VueApp, kernel: KernelAPI): void {
  setKernel(kernel)
  app.provide(KERNEL_KEY, kernel)
}

export function useKernel(): KernelAPI {
  const kernel = inject<KernelAPI>(KERNEL_KEY)
  if (!kernel) {
    throw new Error('[Micronet] useKernel() called outside of a provided kernel context.')
  }
  return kernel
}

export type { ScreenId, ScreenMeta, NavIntent, ScreenRegistration, NavRequest }
export type { Photo, PhotoMetadata, CalendarEvent, BTDevice, BTCharacteristic }
