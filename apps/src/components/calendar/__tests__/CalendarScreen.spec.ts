import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CalendarScreen from '../CalendarScreen.vue'
import { useCalendarStore } from '@micronet/kernel'
import { i18n } from '@micronet/kernel'

vi.mock('../../../composables/storage', () => ({
  storage: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
  },
}))

function mountScreen() {
  return mount(CalendarScreen, {
    global: { plugins: [i18n] },
  })
}

describe('CalendarScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 15, 12, 0))
    const { events } = useCalendarStore()
    events.value = []
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the calendar header', () => {
    const wrapper = mountScreen()
    expect(wrapper.find('.header-title').text()).toBe('Calendar')
    expect(wrapper.find('.month-label').text()).toBe('January 2025')
  })

  it('renders weekday headers', () => {
    const wrapper = mountScreen()
    const weekdays = wrapper.findAll('.weekday')
    expect(weekdays).toHaveLength(7)
    expect(weekdays[0].text()).toBe('Su')
    expect(weekdays[6].text()).toBe('Sa')
  })

  it('renders 42 day cells', () => {
    const wrapper = mountScreen()
    const cells = wrapper.findAll('.day-cell')
    expect(cells).toHaveLength(42)
  })

  it('highlights today', () => {
    const wrapper = mountScreen()
    const todayCell = wrapper.find('.day-cell.is-today')
    expect(todayCell.exists()).toBe(true)
    expect(todayCell.find('.day-number').text()).toBe('15')
  })

  it('selects today by default', () => {
    const wrapper = mountScreen()
    const selectedCell = wrapper.find('.day-cell.is-selected')
    expect(selectedCell.exists()).toBe(true)
    expect(selectedCell.find('.day-number').text()).toBe('15')
  })

  it('navigates to previous month', async () => {
    const wrapper = mountScreen()
    await wrapper.findAll('.nav-btn')[0].trigger('click')
    expect(wrapper.find('.month-label').text()).toBe('December 2024')
  })

  it('navigates to next month', async () => {
    const wrapper = mountScreen()
    await wrapper.findAll('.nav-btn')[1].trigger('click')
    expect(wrapper.find('.month-label').text()).toBe('February 2025')
  })

  it('selects a day on click', async () => {
    const wrapper = mountScreen()
    const dayCells = wrapper.findAll('.day-cell')
    const jan10 = dayCells.find(c => c.find('.day-number').text() === '10' && c.classes().includes('is-current-month') !== false)
    if (jan10) {
      await jan10.trigger('click')
      expect(jan10.classes()).toContain('is-selected')
    }
  })

  it('shows no events message when no events exist', () => {
    const wrapper = mountScreen()
    expect(wrapper.find('.no-events').exists()).toBe(true)
    expect(wrapper.find('.no-events span').text()).toBe('No events')
  })

  it('opens new event modal on add button click', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-event-btn').trigger('click')
    await nextTick()
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.modal-title').text()).toBe('New Event')
  })

  it('creates a new event', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-event-btn').trigger('click')
    await nextTick()

    await wrapper.find('.title-input').setValue('Team Meeting')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    expect(wrapper.find('.event-item').exists()).toBe(true)
    expect(wrapper.find('.event-title').text()).toBe('Team Meeting')
  })

  it('edits an existing event', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-event-btn').trigger('click')
    await nextTick()
    await wrapper.find('.title-input').setValue('Original Title')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    expect(wrapper.find('.event-title').text()).toBe('Original Title')

    await wrapper.find('.event-item').trigger('click')
    await nextTick()
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.modal-title').text()).toBe('Edit Event')

    await wrapper.find('.title-input').setValue('Updated Title')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    expect(wrapper.find('.event-title').text()).toBe('Updated Title')
  })

  it('deletes an event', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-event-btn').trigger('click')
    await nextTick()
    await wrapper.find('.title-input').setValue('To Delete')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    expect(wrapper.find('.event-item').exists()).toBe(true)

    await wrapper.find('.event-item').trigger('click')
    await nextTick()
    await wrapper.find('.delete-event-btn').trigger('click')
    await nextTick()

    expect(wrapper.find('.event-item').exists()).toBe(false)
    expect(wrapper.find('.no-events').exists()).toBe(true)
  })

  it('closes modal on close button click', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-event-btn').trigger('click')
    await nextTick()
    expect(wrapper.find('.modal-overlay').exists()).toBe(true)

    await wrapper.find('.modal-close').trigger('click')
    await nextTick()
    expect(wrapper.find('.modal-overlay').exists()).toBe(false)
  })

  it('closes modal on overlay click', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-event-btn').trigger('click')
    await nextTick()

    await wrapper.find('.modal-overlay').trigger('click.self')
    await nextTick()
    expect(wrapper.find('.modal-overlay').exists()).toBe(false)
  })

  it('navigates to today when Today button is clicked', async () => {
    const wrapper = mountScreen()
    await wrapper.findAll('.nav-btn')[1].trigger('click')
    expect(wrapper.find('.month-label').text()).toBe('February 2025')

    await wrapper.find('.today-pill').trigger('click')
    expect(wrapper.find('.month-label').text()).toBe('January 2025')
  })

  it('shows event dot on days with events', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-event-btn').trigger('click')
    await nextTick()
    await wrapper.find('.title-input').setValue('Test Event')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    expect(wrapper.find('.event-pip').exists()).toBe(true)
  })

  it('disables save when title is empty', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-event-btn').trigger('click')
    await nextTick()

    expect(wrapper.find('.modal-save').attributes('disabled')).toBeDefined()
  })

  it('selects a color in the color picker', async () => {
    const wrapper = mountScreen()
    await wrapper.find('.add-event-btn').trigger('click')
    await nextTick()

    const colorDots = wrapper.findAll('.color-dot')
    expect(colorDots.length).toBeGreaterThan(0)
    await colorDots[2].trigger('click')
    expect(colorDots[2].classes()).toContain('active')
  })

  it('shows events sorted by time', async () => {
    const wrapper = mountScreen()

    await wrapper.find('.add-event-btn').trigger('click')
    await nextTick()
    await wrapper.find('.title-input').setValue('Afternoon')
    const timeInputs = wrapper.findAll('.time-input')
    await timeInputs[0].setValue('14:00')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    await wrapper.find('.add-event-btn').trigger('click')
    await nextTick()
    await wrapper.find('.title-input').setValue('Morning')
    const timeInputs2 = wrapper.findAll('.time-input')
    await timeInputs2[0].setValue('09:00')
    await wrapper.find('.modal-save').trigger('click')
    await nextTick()

    const events = wrapper.findAll('.event-title')
    expect(events[0].text()).toBe('Morning')
    expect(events[1].text()).toBe('Afternoon')
  })
})
