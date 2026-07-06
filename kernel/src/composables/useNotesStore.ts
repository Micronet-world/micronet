import { ref, watch } from 'vue'
import { storage } from './storage'

export interface Note {
  id: string
  title: string
  content: string
  color: string
  pinned: boolean
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'micronet-notes'

const notes = ref<Note[]>([])
let loadPromise: Promise<void> | null = null

function load() {
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    try {
      const raw = await storage.get(STORAGE_KEY)
      if (raw) {
        notes.value = JSON.parse(raw)
      }
    } catch {
      notes.value = []
    }
  })()
  return loadPromise
}

function save() {
  storage.set(STORAGE_KEY, JSON.stringify(notes.value)).catch(() => {})
}

watch(notes, save, { deep: true })

function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function nowISO(): string {
  return new Date().toISOString()
}

export function useNotesStore() {
  load()

  function addNote(note: Pick<Note, 'title' | 'content' | 'color'> & Partial<Pick<Note, 'pinned'>>): string {
    const ts = nowISO()
    const entry: Note = {
      ...note,
      id: generateId(),
      pinned: note.pinned ?? false,
      createdAt: ts,
      updatedAt: ts,
    }
    notes.value.unshift(entry)
    return entry.id
  }

  function updateNote(id: string, updates: Partial<Omit<Note, 'id' | 'createdAt'>>) {
    const idx = notes.value.findIndex(n => n.id === id)
    if (idx !== -1) {
      notes.value[idx] = { ...notes.value[idx], ...updates, updatedAt: nowISO() }
    }
  }

  function deleteNote(id: string) {
    const idx = notes.value.findIndex(n => n.id === id)
    if (idx !== -1) notes.value.splice(idx, 1)
  }

  function togglePin(id: string) {
    const idx = notes.value.findIndex(n => n.id === id)
    if (idx !== -1) {
      notes.value[idx] = { ...notes.value[idx], pinned: !notes.value[idx].pinned, updatedAt: nowISO() }
    }
  }

  function getNoteById(id: string): Note | undefined {
    return notes.value.find(n => n.id === id)
  }

  function searchNotes(query: string): Note[] {
    const q = query.toLowerCase().trim()
    if (!q) return getSortedNotes()
    return getSortedNotes().filter(
      n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q),
    )
  }

  function getSortedNotes(): Note[] {
    return [...notes.value].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return b.updatedAt.localeCompare(a.updatedAt)
    })
  }

  function getPinnedNotes(): Note[] {
    return getSortedNotes().filter(n => n.pinned)
  }

  function getUnpinnedNotes(): Note[] {
    return getSortedNotes().filter(n => !n.pinned)
  }

  return {
    notes,
    addNote,
    updateNote,
    deleteNote,
    togglePin,
    getNoteById,
    searchNotes,
    getSortedNotes,
    getPinnedNotes,
    getUnpinnedNotes,
  }
}
