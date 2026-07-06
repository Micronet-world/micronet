import type { Component, App as VueApp } from 'vue';
import type { ScreenId, ScreenMeta, NavIntent, ScreenRegistration, NavRequest } from './middleware/types';
import type { Photo, PhotoMetadata } from './composables/usePhotoStore';
import type { CalendarEvent } from './composables/useCalendarStore';
import type { BTDevice, BTCharacteristic } from './composables/useBluetooth';
export interface KernelAPI {
    useNavigation(): {
        goTo(screen: ScreenId): void;
        goBack(): void;
        goHome(): void;
        lock(): void;
        navigate(screen: ScreenId): void;
    };
    registerScreen(meta: ScreenMeta, events: Record<string, NavIntent>): void;
    getRegisteredScreen(id: ScreenId): ScreenRegistration | undefined;
    getRegisteredScreens(): ScreenRegistration[];
    resetRegistry(): void;
    onNav(handler: (msg: NavRequest) => void): () => void;
    resetBus(): void;
    registerScreenComponents(components: Record<string, Component>): void;
}
export declare function setKernel(kernel: KernelAPI): void;
export declare function getKernel(): KernelAPI;
export declare function provideKernel(app: VueApp, kernel: KernelAPI): void;
export declare function useKernel(): KernelAPI;
export type { ScreenId, ScreenMeta, NavIntent, ScreenRegistration, NavRequest };
export type { Photo, PhotoMetadata, CalendarEvent, BTDevice, BTCharacteristic };
//# sourceMappingURL=injection.d.ts.map