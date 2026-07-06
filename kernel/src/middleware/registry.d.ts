import type { ScreenId, ScreenMeta, NavIntent, ScreenRegistration } from './types';
export declare function registerScreen(meta: ScreenMeta, events: Record<string, NavIntent>): void;
export declare function getRegisteredScreen(id: ScreenId): ScreenRegistration | undefined;
export declare function getRegisteredScreens(): ScreenRegistration[];
export declare function resetRegistry(): void;
//# sourceMappingURL=registry.d.ts.map