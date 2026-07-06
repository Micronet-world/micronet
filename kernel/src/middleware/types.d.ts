import type { Component } from 'vue';
export type ScreenId = 'lock' | 'home' | 'settings' | 'camera' | 'photos' | 'maps' | 'calendar';
export interface ScreenMeta {
    id: ScreenId;
    label: string;
    color: string;
    icon: string;
}
export type NavIntent = {
    type: 'push';
    screen: ScreenId;
} | {
    type: 'lock';
} | {
    type: 'home';
} | {
    type: 'back';
} | {
    type: 'navigate';
    screen: ScreenId;
};
export interface ScreenRegistration {
    meta: ScreenMeta;
    events: Record<string, NavIntent>;
}
export interface ScreenPlugin extends ScreenRegistration {
    component: Component;
}
export interface NavRequest {
    action: 'push' | 'back' | 'home' | 'lock' | 'navigate';
    screen?: ScreenId;
}
//# sourceMappingURL=types.d.ts.map