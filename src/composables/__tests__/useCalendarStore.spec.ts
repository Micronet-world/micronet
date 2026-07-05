import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useCalendarStore } from '../useCalendarStore'

vi.mock('../storage', () => ({
  storage: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('useCalendarStore', () => {
  beforeEach(() => {
    const { events } = useCalendarStore()
    events.value = []
  })

  it('adds an event and returns an id', () => {
    const { addEvent, events } = useCalendarStore()
    const id = addEvent({ title: 'Meeting', date: '2025-01-15', color: '#007aff' })
    expect(id).toBeTruthy()
    expect(events.value).toHaveLength(1)
    expect(events.value[0].title).toBe('Meeting')
  })

  it('deletes an event by id', () => {
    const { addEvent, deleteEvent, events } = useCalendarStore()
    const id = addEvent({ title: 'Test', date: '2025-01-15', color: '#007aff' })
    expect(events.value).toHaveLength(1)
    deleteEvent(id)
    expect(events.value).toHaveLength(0)
  })

  it('updates an event', () => {
    const { addEvent, updateEvent, events } = useCalendarStore()
    const id = addEvent({ title: 'Old Title', date: '2025-01-15', color: '#007aff' })
    updateEvent(id, { title: 'New Title' })
    expect(events.value[0].title).toBe('New Title')
  })

  it('gets events for a specific date', () => {
    const { addEvent, getEventsForDate } = useCalendarStore()
    addEvent({ title: 'Event A', date: '2025-01-15', color: '#007aff' })
    addEvent({ title: 'Event B', date: '2025-01-16', color: '#ff3b30' })
    addEvent({ title: 'Event C', date: '2025-01-15', startTime: '09:00', color: '#34c759' })

    const jan15 = getEventsForDate('2025-01-15')
    expect(jan15).toHaveLength(2)
    const titles = jan15.map(e => e.title)
    expect(titles).toContain('Event A')
    expect(titles).toContain('Event C')
    expect(jan15[0].title).toBe('Event A')
    expect(jan15[1].title).toBe('Event C')
  })

  it('gets events for a month', () => {
    const { addEvent, getEventsForMonth } = useCalendarStore()
    addEvent({ title: 'Jan Event', date: '2025-01-15', color: '#007aff' })
    addEvent({ title: 'Feb Event', date: '2025-02-10', color: '#ff3b30' })
    addEvent({ title: 'Jan Event 2', date: '2025-01-20', color: '#34c759' })

    const janEvents = getEventsForMonth(2025, 0)
    expect(janEvents).toHaveLength(2)

    const febEvents = getEventsForMonth(2025, 1)
    expect(febEvents).toHaveLength(1)
  })

  it('sorts events by start time', () => {
    const { addEvent, getEventsForDate } = useCalendarStore()
    addEvent({ title: 'Later', date: '2025-01-15', startTime: '14:00', color: '#007aff' })
    addEvent({ title: 'Earlier', date: '2025-01-15', startTime: '09:00', color: '#ff3b30' })
    addEvent({ title: 'No Time', date: '2025-01-15', color: '#34c759' })

    const events = getEventsForDate('2025-01-15')
    expect(events[0].title).toBe('No Time')
    expect(events[1].title).toBe('Earlier')
    expect(events[2].title).toBe('Later')
  })
})
