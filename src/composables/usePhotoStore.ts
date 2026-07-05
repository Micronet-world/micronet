import { ref, watch } from 'vue'
import { storage } from './storage'

export interface PhotoMetadata {
  width?: number
  height?: number
  facingMode?: 'user' | 'environment'
  filter?: string
  zoom?: number
  flashMode?: 'off' | 'on' | 'torch'
  captureMethod?: 'imageCapture' | 'canvas'
  orientation?: string
  mimeType?: string
  duration?: number
  videoBitsPerSecond?: number
  audioBitsPerSecond?: number
  timezone?: number
  location?: { latitude: number; longitude: number; altitude?: number | null; accuracy?: number }
  deviceInfo?: string
}

export interface Photo {
  id: string
  data: string
  type: 'photo' | 'video'
  timestamp: number
  favorite: boolean
  metadata?: PhotoMetadata
}

const STORAGE_KEY = 'mobile-photos'

// Module-scope singleton state
const photos = ref<Photo[]>([])
let loadPromise: Promise<void> | null = null

function load() {
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    try {
      const raw = await storage.get(STORAGE_KEY)
      if (raw) {
        photos.value = JSON.parse(raw)
      }
    } catch {
      // corrupt data — start fresh
      photos.value = []
    }
  })()
  return loadPromise
}

function save() {
  storage.set(STORAGE_KEY, JSON.stringify(photos.value)).catch(() => {
    // storage full — silently fail
  })
}

// Auto-save on mutation
watch(photos, save, { deep: true })

export function usePhotoStore() {
  load()

  function addPhoto(data: string, type: 'photo' | 'video' = 'photo', metadata?: PhotoMetadata) {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    const entry: Photo = {
      id,
      data,
      type,
      timestamp: Date.now(),
      favorite: false,
    }
    if (metadata) entry.metadata = metadata

    photos.value.unshift(entry)
  }

  function deletePhoto(id: string) {
    const idx = photos.value.findIndex(p => p.id === id)
    if (idx !== -1) photos.value.splice(idx, 1)
  }

  function deletePhotos(ids: string[]) {
    const idSet = new Set(ids)
    photos.value = photos.value.filter(p => !idSet.has(p.id))
  }

  function toggleFavorite(id: string) {
    const photo = photos.value.find(p => p.id === id)
    if (photo) photo.favorite = !photo.favorite
  }

  function clearAll() {
    photos.value = []
  }

  return {
    photos,
    addPhoto,
    deletePhoto,
    deletePhotos,
    toggleFavorite,
    clearAll,
  }
}
