/**
 * Async key-value storage with automatic backend detection.
 *
 * Tiers (in order of preference):
 *   1. OPFS (Origin Private File System) — fast, large capacity, no origin quota
 *   2. IndexedDB — widely supported, large capacity, structured storage
 *   3. localStorage — synchronous fallback, ~5 MB limit
 */
export declare const storage: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    del(key: string): Promise<void>;
};
//# sourceMappingURL=storage.d.ts.map