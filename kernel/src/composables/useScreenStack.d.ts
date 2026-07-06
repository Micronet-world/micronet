import type { ScreenId, NavIntent } from '../middleware/types';
export declare function useScreenStack(): {
    screenStack: import("vue").Ref<ScreenId[], ScreenId[]>;
    currentScreen: import("vue").ComputedRef<ScreenId>;
    dispatch: (intent: NavIntent) => void;
};
//# sourceMappingURL=useScreenStack.d.ts.map