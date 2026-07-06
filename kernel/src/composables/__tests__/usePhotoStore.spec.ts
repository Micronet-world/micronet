import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePhotoStore } from '../usePhotoStore'

vi.mock('../storage', () => ({
  storage: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('usePhotoStore', () => {
  beforeEach(() => {
    const { clearAll } = usePhotoStore()
    clearAll()
  })

  it('addPhoto adds a photo to the store', () => {
    const { addPhoto, photos } = usePhotoStore()
    addPhoto('data:image/png;base64,abc')
    expect(photos.value).toHaveLength(1)
    expect(photos.value[0].data).toBe('data:image/png;base64,abc')
    expect(photos.value[0].type).toBe('photo')
  })

  it('addPhoto with type video stores video type', () => {
    const { addPhoto, photos } = usePhotoStore()
    addPhoto('data:video/mp4;base64,xyz', 'video')
    expect(photos.value).toHaveLength(1)
    expect(photos.value[0].type).toBe('video')
  })

  it('addPhoto with metadata stores metadata', () => {
    const { addPhoto, photos } = usePhotoStore()
    addPhoto('data', 'photo', { width: 1920, height: 1080, filter: 'vivid' })
    expect(photos.value[0].metadata).toEqual({ width: 1920, height: 1080, filter: 'vivid' })
  })

  it('deletePhoto removes a photo by id', () => {
    const { addPhoto, deletePhoto, photos } = usePhotoStore()
    addPhoto('first')
    addPhoto('second')
    expect(photos.value).toHaveLength(2)
    const firstId = photos.value[1].id
    deletePhoto(firstId)
    expect(photos.value).toHaveLength(1)
    expect(photos.value[0].data).toBe('second')
  })

  it('deletePhotos removes multiple photos', () => {
    const { addPhoto, deletePhotos, photos } = usePhotoStore()
    addPhoto('a')
    addPhoto('b')
    addPhoto('c')
    const ids = [photos.value[0].id, photos.value[2].id]
    deletePhotos(ids)
    expect(photos.value).toHaveLength(1)
    expect(photos.value[0].data).toBe('b')
  })

  it('toggleFavorite toggles the favorite flag', () => {
    const { addPhoto, toggleFavorite, photos } = usePhotoStore()
    addPhoto('data')
    expect(photos.value[0].favorite).toBe(false)
    toggleFavorite(photos.value[0].id)
    expect(photos.value[0].favorite).toBe(true)
    toggleFavorite(photos.value[0].id)
    expect(photos.value[0].favorite).toBe(false)
  })

  it('clearAll removes all photos', () => {
    const { addPhoto, clearAll, photos } = usePhotoStore()
    addPhoto('a')
    addPhoto('b')
    clearAll()
    expect(photos.value).toHaveLength(0)
  })

  it('photos are added to the beginning (unshift)', () => {
    const { addPhoto, photos } = usePhotoStore()
    addPhoto('first')
    addPhoto('second')
    expect(photos.value[0].data).toBe('second')
    expect(photos.value[1].data).toBe('first')
  })

  it('each photo gets a unique id', () => {
    const { addPhoto, photos } = usePhotoStore()
    addPhoto('a')
    addPhoto('b')
    addPhoto('c')
    const ids = photos.value.map(p => p.id)
    expect(new Set(ids).size).toBe(3)
  })

  it('loading from storage populates photos', async () => {
    vi.resetModules()
    const stored = [{ id: 'stored-1', data: 'stored', type: 'photo', timestamp: 1000, favorite: false }]
    const { storage } = await import('../storage')
    vi.mocked(storage.get).mockReset().mockResolvedValue(JSON.stringify(stored))
    const { usePhotoStore: freshStore } = await import('../usePhotoStore')
    const { photos } = freshStore()
    await vi.waitFor(() => {
      expect(photos.value).toHaveLength(1)
    })
    expect(photos.value[0].id).toBe('stored-1')
  })
})
