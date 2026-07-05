import { ref, watch } from 'vue'
import { storage } from './storage'

export interface CalendarEvent {
  id: string
  title: string
  date: string
  startTime?: string
  endTime?: string
  color: string
  notes?: string
}

const STORAGE_KEY = 'micronet-calendar-events'

const events = ref<CalendarEvent[]>([])
let loadPromise: Promise<void> | null = null

function load() {
  if (loadPromise) return loadPromise
  loadPromise = (async () => {
    try {
      const raw = await storage.get(STORAGE_KEY)
      if (raw) {
        events.value = JSON.parse(raw)
      }
    } catch {
      events.value = []
    }
  })()
  return loadPromise
}

function save() {
  storage.set(STORAGE_KEY, JSON.stringify(events.value)).catch(() => {})
}

watch(events, save, { deep: true })

function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function useCalendarStore() {
  load()

  function addEvent(event: Omit<CalendarEvent, 'id'>) {
    const entry: CalendarEvent = { ...event, id: generateId() }
    events.value.push(entry)
    return entry.id
  }

  function updateEvent(id: string, updates: Partial<Omit<CalendarEvent, 'id'>>) {
    const idx = events.value.findIndex(e => e.id === id)
    if (idx !== -1) {
      events.value[idx] = { ...events.value[idx], ...updates }
    }
  }

  function deleteEvent(id: string) {
    const idx = events.value.findIndex(e => e.id === id)
    if (idx !== -1) events.value.splice(idx, 1)
  }

  function getEventsForDate(date: string): CalendarEvent[] {
    return events.value
      .filter(e => e.date === date)
      .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
  }

  function getEventsForMonth(year: number, month: number): CalendarEvent[] {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`
    return events.value.filter(e => e.date.startsWith(prefix))
  }

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsForDate,
    getEventsForMonth,
  }
}
