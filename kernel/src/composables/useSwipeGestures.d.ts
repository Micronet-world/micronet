export interface SwipeOptions {
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    onSwipeRight?: () => void;
    threshold?: number;
    canSwipeVertical?: () => boolean;
    canSwipeHorizontal?: () => boolean;
    /** Fires once when an upward swipe crosses `threshold` and the pointer then
     *  pauses (stops moving) for `holdDelay` ms while still pressed. When it
     *  fires, the matching `onSwipeUp` is suppressed on release. */
    onHoldUp?: () => void;
    holdDelay?: number;
}
export declare function useSwipeGestures(options: SwipeOptions): {
    targetRef: (el: unknown) => void;
    dragProgress: import("vue").Ref<number, number>;
    swipeDirection: import("vue").Ref<"up" | "down" | "left" | "right" | null, "up" | "down" | "left" | "right" | null>;
    isDragging: import("vue").Ref<boolean, boolean>;
};
//# sourceMappingURL=useSwipeGestures.d.ts.map