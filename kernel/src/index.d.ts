export { setKernel, getKernel, provideKernel, useKernel } from './injection';
export type { KernelAPI } from './injection';
export type { ScreenId, ScreenMeta, NavIntent, ScreenRegistration, ScreenPlugin, NavRequest } from './middleware/types';
export { useNavigation } from './middleware/navigation';
export { registerScreen, getRegisteredScreen, getRegisteredScreens, resetRegistry } from './middleware/registry';
export { useKernelBridge } from './middleware/kernel';
export { onNav, resetBus } from './middleware/bus';
export { screenComponents, registerScreenComponents, getScreenComponent } from './middleware/screens';
export { useScreenStack } from './composables/useScreenStack';
export { useSwipeGestures } from './composables/useSwipeGestures';
export { storage } from './composables/storage';
export { usePhotoStore } from './composables/usePhotoStore';
export type { Photo, PhotoMetadata } from './composables/usePhotoStore';
export { useCalendarStore } from './composables/useCalendarStore';
export type { CalendarEvent } from './composables/useCalendarStore';
export { useBluetooth } from './composables/useBluetooth';
export type { BTDevice, BTCharacteristic } from './composables/useBluetooth';
export { default as i18n, setLocale, getLocale } from './i18n';
//# sourceMappingURL=index.d.ts.map