import { ref, watch } from 'vue'

export interface Photo {
  id: string
  data: string
  type: 'photo' | 'video'
  timestamp: number
  favorite: boolean
}

const STORAGE_KEY = 'mobile-photos'

// Module-scope singleton state
const photos = ref<Photo[]>([])
let loaded = false

function load() {
  if (loaded) return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      photos.value = JSON.parse(raw)
    }
  } catch {
    // corrupt data — start fresh
    photos.value = []
  }
  loaded = true
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos.value))
  } catch {
    // storage full — silently fail
  }
}

// Auto-save on mutation
watch(photos, save, { deep: true })

export function usePhotoStore() {
  load()

  function addPhoto(data: string, type: 'photo' | 'video' = 'photo') {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

    photos.value.unshift({
      id,
      data,
      type,
      timestamp: Date.now(),
      favorite: false,
    })
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
