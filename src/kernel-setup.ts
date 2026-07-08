import type { KernelAPI } from '@micronet/kernel'
import {
  useNavigation,
  registerScreen,
  getRegisteredScreen,
  getRegisteredScreens,
  resetRegistry,
  onNav,
  resetBus,
  registerScreenComponents,
} from '@micronet/kernel'

/**
 * Constructs the KernelAPI that wires the kernel middleware into a single
 * object.  Called by main.ts (before loading apps) and by App.vue (for the
 * Vue provide/inject layer).
 */
export function createKernelAPI(): KernelAPI {
  return {
    useNavigation,
    registerScreen,
    getRegisteredScreen,
    getRegisteredScreens,
    resetRegistry,
    onNav,
    resetBus,
    registerScreenComponents,
  }
}
