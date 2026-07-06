import type { Component } from 'vue';
import type { ScreenId } from './types';
export declare const screenComponents: Partial<Record<ScreenId, Component>>;
export declare function registerScreenComponents(components: Record<string, Component>): void;
export declare function getScreenComponent(id: ScreenId): Component | undefined;
//# sourceMappingURL=screens.d.ts.map