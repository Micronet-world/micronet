// Injection primitives — runtime dependency injection for SDK and Apps
export { setKernel, getKernel, provideKernel, useKernel } from './injection'
export type { KernelAPI } from './injection'

// Middleware types (type-only, erased at runtime)
export type { ScreenId, ScreenMeta, NavIntent, ScreenRegistration, ScreenPlugin, NavRequest } from './middleware/types'

// Middleware APIs (direct — used by host app to construct KernelAPI)
export { useNavigation } from './middleware/navigation'
export { registerScreen, getRegisteredScreen, getRegisteredScreens, resetRegistry } from './middleware/registry'
export { useKernelBridge } from './middleware/kernel'
export { onNav, resetBus } from './middleware/bus'
export { screenComponents, registerScreenComponents, getScreenComponent } from './middleware/screens'

// Composables (stateless — safe to import directly)
export { useScreenStack } from './composables/useScreenStack'
export { useSwipeGestures } from './composables/useSwipeGestures'
export { storage } from './composables/storage'
export { usePhotoStore } from './composables/usePhotoStore'
export type { Photo, PhotoMetadata } from './composables/usePhotoStore'
export { useCalendarStore } from './composables/useCalendarStore'
export type { CalendarEvent } from './composables/useCalendarStore'
export { useNotesStore } from './composables/useNotesStore'
export type { Note } from './composables/useNotesStore'
export { useFileStore } from './composables/useFileStore'
export type { FileItem, FileType } from './composables/useFileStore'
export { useBluetooth } from './composables/useBluetooth'
export type { BTDevice, BTCharacteristic } from './composables/useBluetooth'

// i18n (independent Vue plugin)
export { default as i18n, setLocale, getLocale } from './i18n'
