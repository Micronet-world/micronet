import type { NavRequest, ScreenRegistration } from './types';
type Handler<T> = (msg: T) => void;
export declare function emitNav(msg: NavRequest): void;
export declare function emitScreen(reg: ScreenRegistration): void;
export declare function onNav(handler: Handler<NavRequest>): () => void;
export declare function onScreen(handler: Handler<ScreenRegistration>): () => void;
export declare function resetBus(): void;
export {};
//# sourceMappingURL=bus.d.ts.map