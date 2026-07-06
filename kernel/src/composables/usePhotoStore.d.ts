export interface PhotoMetadata {
    width?: number;
    height?: number;
    facingMode?: 'user' | 'environment';
    filter?: string;
    zoom?: number;
    flashMode?: 'off' | 'on' | 'torch';
    captureMethod?: 'imageCapture' | 'canvas';
    orientation?: string;
    mimeType?: string;
    duration?: number;
    videoBitsPerSecond?: number;
    audioBitsPerSecond?: number;
    timezone?: number;
    location?: {
        latitude: number;
        longitude: number;
        altitude?: number | null;
        accuracy?: number;
    };
    deviceInfo?: string;
}
export interface Photo {
    id: string;
    data: string;
    type: 'photo' | 'video';
    timestamp: number;
    favorite: boolean;
    metadata?: PhotoMetadata;
}
export declare function usePhotoStore(): {
    photos: import("vue").Ref<{
        id: string;
        data: string;
        type: "photo" | "video";
        timestamp: number;
        favorite: boolean;
        metadata?: {
            width?: number | undefined;
            height?: number | undefined;
            facingMode?: "user" | "environment" | undefined;
            filter?: string | undefined;
            zoom?: number | undefined;
            flashMode?: "off" | "on" | "torch" | undefined;
            captureMethod?: "imageCapture" | "canvas" | undefined;
            orientation?: string | undefined;
            mimeType?: string | undefined;
            duration?: number | undefined;
            videoBitsPerSecond?: number | undefined;
            audioBitsPerSecond?: number | undefined;
            timezone?: number | undefined;
            location?: {
                latitude: number;
                longitude: number;
                altitude?: number | null | undefined;
                accuracy?: number | undefined;
            } | undefined;
            deviceInfo?: string | undefined;
        } | undefined;
    }[], Photo[] | {
        id: string;
        data: string;
        type: "photo" | "video";
        timestamp: number;
        favorite: boolean;
        metadata?: {
            width?: number | undefined;
            height?: number | undefined;
            facingMode?: "user" | "environment" | undefined;
            filter?: string | undefined;
            zoom?: number | undefined;
            flashMode?: "off" | "on" | "torch" | undefined;
            captureMethod?: "imageCapture" | "canvas" | undefined;
            orientation?: string | undefined;
            mimeType?: string | undefined;
            duration?: number | undefined;
            videoBitsPerSecond?: number | undefined;
            audioBitsPerSecond?: number | undefined;
            timezone?: number | undefined;
            location?: {
                latitude: number;
                longitude: number;
                altitude?: number | null | undefined;
                accuracy?: number | undefined;
            } | undefined;
            deviceInfo?: string | undefined;
        } | undefined;
    }[]>;
    addPhoto: (data: string, type?: "photo" | "video", metadata?: PhotoMetadata) => void;
    deletePhoto: (id: string) => void;
    deletePhotos: (ids: string[]) => void;
    toggleFavorite: (id: string) => void;
    clearAll: () => void;
};
//# sourceMappingURL=usePhotoStore.d.ts.map