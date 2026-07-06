import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ClockScreen from '../ClockScreen.vue'
import { i18n, resetBus, onNav } from 'micronet-kernel'
import type { NavRequest } from 'micronet-kernel'

function mountScreen() {
  return mount(ClockScreen, {
    global: { plugins: [i18n] },
  })
}

describe('ClockScreen', () => {
  let navLog: NavRequest[][]
  let offNav: () => void

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30, 0))
    resetBus()
    navLog = []
    offNav = onNav((msg) => { navLog.push([msg]) })
  })

  afterEach(() => {
    offNav()
    resetBus()
    vi.useRealTimers()
  })

  describe('Tabs', () => {
    it('renders the tab bar with four tabs', () => {
      const wrapper = mountScreen()
      const tabs = wrapper.findAll('.tab-btn')
      expect(tabs).toHaveLength(4)
    })

    it('defaults to world clock tab', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.world-tab').exists()).toBe(true)
    })

    it('switches to alarm tab on click', async () => {
      const wrapper = mountScreen()
      const tabs = wrapper.findAll('.tab-btn')
      await tabs[1].trigger('click')
      expect(wrapper.find('.alarm-tab').exists()).toBe(true)
    })

    it('switches to stopwatch tab on click', async () => {
      const wrapper = mountScreen()
      const tabs = wrapper.findAll('.tab-btn')
      await tabs[2].trigger('click')
      expect(wrapper.find('.stopwatch-tab').exists()).toBe(true)
    })

    it('switches to timer tab on click', async () => {
      const wrapper = mountScreen()
      const tabs = wrapper.findAll('.tab-btn')
      await tabs[3].trigger('click')
      expect(wrapper.find('.timer-tab').exists()).toBe(true)
    })

    it('highlights the active tab', async () => {
      const wrapper = mountScreen()
      const tabs = wrapper.findAll('.tab-btn')
      expect(tabs[0].classes()).toContain('active')
      await tabs[1].trigger('click')
      expect(tabs[1].classes()).toContain('active')
      expect(tabs[0].classes()).not.toContain('active')
    })
  })

  describe('World Clock', () => {
    it('shows default cities', () => {
      const wrapper = mountScreen()
      const rows = wrapper.findAll('.city-row')
      expect(rows.length).toBe(3)
    })

    it('displays city names', () => {
      const wrapper = mountScreen()
      const names = wrapper.findAll('.city-name')
      expect(names[0].text()).toBe('New York')
      expect(names[1].text()).toBe('London')
      expect(names[2].text()).toBe('Tokyo')
    })

    it('displays timezone abbreviations', () => {
      const wrapper = mountScreen()
      const tzs = wrapper.findAll('.city-tz')
      expect(tzs[0].text()).toBe('EST')
      expect(tzs[1].text()).toBe('GMT')
      expect(tzs[2].text()).toBe('JST')
    })

    it('shows times for each city', () => {
      const wrapper = mountScreen()
      const times = wrapper.findAll('.city-time')
      expect(times).toHaveLength(3)
      // Each time should match H:MM AM/PM format
      times.forEach(t => {
        expect(t.text()).toMatch(/^\d{1,2}:\d{2} (AM|PM)$/)
      })
    })

    it('enters edit mode on edit button click', async () => {
      const wrapper = mountScreen()
      await wrapper.find('.header-btn').trigger('click')
      expect(wrapper.find('.delete-city-btn').exists()).toBe(true)
    })

    it('removes a city in edit mode', async () => {
      const wrapper = mountScreen()
      await wrapper.find('.header-btn').trigger('click')
      const deleteButtons = wrapper.findAll('.delete-city-btn')
      expect(deleteButtons.length).toBe(3)
      await deleteButtons[0].trigger('click')
      expect(wrapper.findAll('.city-row').length).toBe(2)
    })

    it('opens city picker on add button click', async () => {
      const wrapper = mountScreen()
      await wrapper.find('.add-btn').trigger('click')
      expect(wrapper.find('.city-picker-modal').exists()).toBe(true)
    })

    it('adds a city from the picker', async () => {
      const wrapper = mountScreen()
      await wrapper.find('.add-btn').trigger('click')
      await nextTick()
      const rows = wrapper.findAll('.city-picker-row')
      expect(rows.length).toBeGreaterThan(0)
      await rows[0].trigger('click')
      expect(wrapper.findAll('.city-row').length).toBe(4)
    })

    it('filters cities in search', async () => {
      const wrapper = mountScreen()
      await wrapper.find('.add-btn').trigger('click')
      await nextTick()
      await wrapper.find('.search-input').setValue('Tokyo')
      const rows = wrapper.findAll('.city-picker-row')
      expect(rows.length).toBe(0)
    })

    it('shows empty state when no cities', async () => {
      const wrapper = mountScreen()
      await wrapper.find('.header-btn').trigger('click')
      const deleteButtons = wrapper.findAll('.delete-city-btn')
      for (const btn of deleteButtons) {
        await btn.trigger('click')
      }
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('shows day offset for cities on different days', () => {
      vi.setSystemTime(new Date(2025, 0, 15, 23, 0, 0))
      const wrapper = mountScreen()
      const offsets = wrapper.findAll('.city-day-offset')
      expect(offsets.length).toBeGreaterThan(0)
    })
  })

  describe('Alarm', () => {
    async function goToAlarm(wrapper: ReturnType<typeof mountScreen>) {
      const tabs = wrapper.findAll('.tab-btn')
      await tabs[1].trigger('click')
    }

    it('shows default alarms', async () => {
      const wrapper = mountScreen()
      await goToAlarm(wrapper)
      const rows = wrapper.findAll('.alarm-row')
      expect(rows.length).toBe(2)
    })

    it('displays alarm times', async () => {
      const wrapper = mountScreen()
      await goToAlarm(wrapper)
      const times = wrapper.findAll('.alarm-time')
      expect(times[0].text()).toBe('7:00')
      expect(times[1].text()).toBe('10:30')
    })

    it('displays alarm period', async () => {
      const wrapper = mountScreen()
      await goToAlarm(wrapper)
      const periods = wrapper.findAll('.alarm-period')
      expect(periods[0].text()).toBe('AM')
      expect(periods[1].text()).toBe('PM')
    })

    it('toggles alarm on switch click', async () => {
      const wrapper = mountScreen()
      await goToAlarm(wrapper)
      const toggles = wrapper.findAll('.alarm-toggle')
      expect(toggles.length).toBe(2)
      await toggles[0].trigger('click')
      await nextTick()
      const track = toggles[0].find('.toggle-track')
      expect(track.classes()).not.toContain('on')
    })

    it('opens new alarm modal on add button click', async () => {
      const wrapper = mountScreen()
      await goToAlarm(wrapper)
      await wrapper.find('.add-btn').trigger('click')
      await nextTick()
      expect(wrapper.find('.alarm-modal').exists()).toBe(true)
      expect(wrapper.find('.modal-title').exists()).toBe(true)
    })

    it('creates a new alarm', async () => {
      const wrapper = mountScreen()
      await goToAlarm(wrapper)
      await wrapper.find('.add-btn').trigger('click')
      await nextTick()
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      expect(wrapper.findAll('.alarm-row').length).toBe(3)
    })

    it('opens edit alarm on row click', async () => {
      const wrapper = mountScreen()
      await goToAlarm(wrapper)
      await wrapper.findAll('.alarm-row')[0].trigger('click')
      await nextTick()
      expect(wrapper.find('.alarm-modal').exists()).toBe(true)
      expect(wrapper.find('.modal-title').exists()).toBe(true)
    })

    it('deletes an alarm from edit modal', async () => {
      const wrapper = mountScreen()
      await goToAlarm(wrapper)
      await wrapper.findAll('.alarm-row')[0].trigger('click')
      await nextTick()
      await wrapper.find('.delete-alarm-btn').trigger('click')
      await nextTick()
      expect(wrapper.findAll('.alarm-row').length).toBe(1)
    })

    it('increments and decrements hour', async () => {
      const wrapper = mountScreen()
      await goToAlarm(wrapper)
      await wrapper.find('.add-btn').trigger('click')
      await nextTick()
      const hourBtns = wrapper.findAll('.tp-btn')
      const initialHour = wrapper.find('.tp-value').text()
      await hourBtns[0].trigger('click')
      const newHour = wrapper.find('.tp-value').text()
      expect(newHour).not.toBe(initialHour)
    })

    it('increments and decrements minute', async () => {
      const wrapper = mountScreen()
      await goToAlarm(wrapper)
      await wrapper.find('.add-btn').trigger('click')
      await nextTick()
      const minuteUpBtn = wrapper.findAll('.tp-btn')[2]
      const initialMin = wrapper.findAll('.tp-value')[1].text()
      await minuteUpBtn.trigger('click')
      const newMin = wrapper.findAll('.tp-value')[1].text()
      expect(newMin).not.toBe(initialMin)
    })

    it('shows empty state when no alarms', async () => {
      const wrapper = mountScreen()
      await goToAlarm(wrapper)
      // Delete both alarms
      await wrapper.findAll('.alarm-row')[0].trigger('click')
      await nextTick()
      await wrapper.find('.delete-alarm-btn').trigger('click')
      await nextTick()
      await wrapper.findAll('.alarm-row')[0].trigger('click')
      await nextTick()
      await wrapper.find('.delete-alarm-btn').trigger('click')
      await nextTick()
      expect(wrapper.find('.empty-state').exists()).toBe(true)
    })

    it('changes repeat option', async () => {
      const wrapper = mountScreen()
      await goToAlarm(wrapper)
      await wrapper.findAll('.alarm-row')[0].trigger('click')
      await nextTick()
      const select = wrapper.find('.option-select')
      await select.setValue('every_day')
      await wrapper.find('.modal-save').trigger('click')
      await nextTick()
      expect(wrapper.findAll('.alarm-repeat')[0].text()).not.toBe('')
    })

    it('toggles sound and snooze', async () => {
      const wrapper = mountScreen()
      await goToAlarm(wrapper)
      await wrapper.find('.add-btn').trigger('click')
      await nextTick()
      const toggleBtns = wrapper.findAll('.toggle-btn')
      expect(toggleBtns.length).toBe(2)
      await toggleBtns[0].trigger('click')
      await nextTick()
      const track = toggleBtns[0].find('.toggle-track')
      expect(track.classes()).not.toContain('on')
    })

    it('closes alarm modal on close button', async () => {
      const wrapper = mountScreen()
      await goToAlarm(wrapper)
      await wrapper.find('.add-btn').trigger('click')
      await nextTick()
      expect(wrapper.find('.alarm-modal').exists()).toBe(true)
      await wrapper.find('.modal-close').trigger('click')
      await nextTick()
      expect(wrapper.find('.alarm-modal').exists()).toBe(false)
    })
  })

  describe('Stopwatch', () => {
    async function goToStopwatch(wrapper: ReturnType<typeof mountScreen>) {
      const tabs = wrapper.findAll('.tab-btn')
      await tabs[2].trigger('click')
    }

    it('starts at 00:00.00', async () => {
      const wrapper = mountScreen()
      await goToStopwatch(wrapper)
      expect(wrapper.find('.stopwatch-time').text()).toBe('00:00.00')
    })

    it('starts the stopwatch', async () => {
      const wrapper = mountScreen()
      await goToStopwatch(wrapper)
      await wrapper.find('.sw-btn.primary').trigger('click')
      expect(wrapper.find('.sw-btn.primary').classes()).toContain('running')
      expect(wrapper.find('.sw-btn.primary').text()).not.toBe('')
    })

    it('stops the stopwatch', async () => {
      const wrapper = mountScreen()
      await goToStopwatch(wrapper)
      await wrapper.find('.sw-btn.primary').trigger('click')
      vi.advanceTimersByTime(1500)
      await nextTick()
      await wrapper.find('.sw-btn.primary').trigger('click')
      expect(wrapper.find('.sw-btn.primary').classes()).not.toContain('running')
      expect(wrapper.find('.stopwatch-time').text()).not.toBe('00:00.00')
    })

    it('resets the stopwatch', async () => {
      const wrapper = mountScreen()
      await goToStopwatch(wrapper)
      await wrapper.find('.sw-btn.primary').trigger('click')
      vi.advanceTimersByTime(1000)
      await nextTick()
      await wrapper.find('.sw-btn.primary').trigger('click')
      await nextTick()
      await wrapper.find('.sw-btn.secondary').trigger('click')
      await nextTick()
      expect(wrapper.find('.stopwatch-time').text()).toBe('00:00.00')
    })

    it('records a lap', async () => {
      const wrapper = mountScreen()
      await goToStopwatch(wrapper)
      await wrapper.find('.sw-btn.primary').trigger('click')
      vi.advanceTimersByTime(1000)
      await nextTick()
      await wrapper.find('.sw-btn.secondary').trigger('click')
      await nextTick()
      expect(wrapper.findAll('.lap-row').length).toBe(1)
    })

    it('records multiple laps', async () => {
      const wrapper = mountScreen()
      await goToStopwatch(wrapper)
      await wrapper.find('.sw-btn.primary').trigger('click')
      vi.advanceTimersByTime(1000)
      await nextTick()
      await wrapper.find('.sw-btn.secondary').trigger('click')
      vi.advanceTimersByTime(1000)
      await nextTick()
      await wrapper.find('.sw-btn.secondary').trigger('click')
      await nextTick()
      expect(wrapper.findAll('.lap-row').length).toBe(2)
    })

    it('shows laps section when laps exist', async () => {
      const wrapper = mountScreen()
      await goToStopwatch(wrapper)
      await wrapper.find('.sw-btn.primary').trigger('click')
      vi.advanceTimersByTime(500)
      await nextTick()
      await wrapper.find('.sw-btn.secondary').trigger('click')
      await nextTick()
      expect(wrapper.find('.laps-container').exists()).toBe(true)
      expect(wrapper.find('.laps-title').exists()).toBe(true)
    })

    it('resets laps when resetting stopwatch', async () => {
      const wrapper = mountScreen()
      await goToStopwatch(wrapper)
      await wrapper.find('.sw-btn.primary').trigger('click')
      vi.advanceTimersByTime(500)
      await nextTick()
      await wrapper.find('.sw-btn.secondary').trigger('click')
      await nextTick()
      expect(wrapper.findAll('.lap-row').length).toBe(1)
      // Stop then reset
      await wrapper.find('.sw-btn.primary').trigger('click')
      await nextTick()
      await wrapper.find('.sw-btn.secondary').trigger('click')
      await nextTick()
      expect(wrapper.findAll('.lap-row').length).toBe(0)
    })

    it('displays elapsed time while running', async () => {
      const wrapper = mountScreen()
      await goToStopwatch(wrapper)
      await wrapper.find('.sw-btn.primary').trigger('click')
      vi.advanceTimersByTime(2500)
      await nextTick()
      const time = wrapper.find('.stopwatch-time').text()
      expect(time).toMatch(/00:02\.\d{2}/)
    })
  })

  describe('Timer', () => {
    async function goToTimer(wrapper: ReturnType<typeof mountScreen>) {
      const tabs = wrapper.findAll('.tab-btn')
      await tabs[3].trigger('click')
    }

    it('shows the timer setup view by default', async () => {
      const wrapper = mountScreen()
      await goToTimer(wrapper)
      expect(wrapper.find('.timer-setup').exists()).toBe(true)
    })

    it('displays preset buttons', async () => {
      const wrapper = mountScreen()
      await goToTimer(wrapper)
      const presets = wrapper.findAll('.preset-btn')
      expect(presets.length).toBe(7)
    })

    it('sets a preset duration', async () => {
      const wrapper = mountScreen()
      await goToTimer(wrapper)
      const presets = wrapper.findAll('.preset-btn')
      await presets[0].trigger('click') // 1 min
      await nextTick()
      expect(presets[0].classes()).toContain('active')
    })

    it('starts the timer', async () => {
      const wrapper = mountScreen()
      await goToTimer(wrapper)
      await wrapper.find('.sw-btn.primary').trigger('click')
      await nextTick()
      expect(wrapper.find('.timer-running').exists()).toBe(true)
    })

    it('pauses the timer', async () => {
      const wrapper = mountScreen()
      await goToTimer(wrapper)
      await wrapper.find('.sw-btn.primary').trigger('click')
      await nextTick()
      await wrapper.find('.sw-btn.primary').trigger('click')
      await nextTick()
      expect(wrapper.find('.sw-btn.primary').classes()).not.toContain('running')
    })

    it('cancels the timer', async () => {
      const wrapper = mountScreen()
      await goToTimer(wrapper)
      await wrapper.find('.sw-btn.primary').trigger('click')
      await nextTick()
      await wrapper.find('.sw-btn.secondary').trigger('click')
      await nextTick()
      expect(wrapper.find('.timer-setup').exists()).toBe(true)
    })

    it('counts down', async () => {
      const wrapper = mountScreen()
      await goToTimer(wrapper)
      // Set 5 min preset
      const presets = wrapper.findAll('.preset-btn')
      await presets[2].trigger('click')
      await nextTick()
      await wrapper.find('.sw-btn.primary').trigger('click')
      await nextTick()
      vi.advanceTimersByTime(3000)
      await nextTick()
      const ringText = wrapper.find('.timer-ring-text').text()
      expect(ringText).toMatch(/04:5[78]/)
    })

    it('shows time is up alert when timer finishes', async () => {
      const wrapper = mountScreen()
      await goToTimer(wrapper)
      // Set 1 min preset
      const presets = wrapper.findAll('.preset-btn')
      await presets[0].trigger('click')
      await nextTick()
      await wrapper.find('.sw-btn.primary').trigger('click')
      await nextTick()
      vi.advanceTimersByTime(61000)
      await nextTick()
      expect(wrapper.find('.timer-alert').exists()).toBe(true)
      expect(wrapper.find('.timer-alert-text').exists()).toBe(true)
    })

    it('dismisses the timer alert', async () => {
      const wrapper = mountScreen()
      await goToTimer(wrapper)
      const presets = wrapper.findAll('.preset-btn')
      await presets[0].trigger('click')
      await nextTick()
      await wrapper.find('.sw-btn.primary').trigger('click')
      await nextTick()
      vi.advanceTimersByTime(61000)
      await nextTick()
      await wrapper.find('.timer-alert-btn').trigger('click')
      await nextTick()
      expect(wrapper.find('.timer-alert').exists()).toBe(false)
      expect(wrapper.find('.timer-setup').exists()).toBe(true)
    })

    it('increments and decrements timer hours', async () => {
      const wrapper = mountScreen()
      await goToTimer(wrapper)
      const digitBtns = wrapper.findAll('.digit-btn')
      await digitBtns[0].trigger('click') // increment hours
      await nextTick()
      expect(wrapper.findAll('.digit-value')[0].text()).toBe('01')
    })

    it('increments and decrements timer minutes', async () => {
      const wrapper = mountScreen()
      await goToTimer(wrapper)
      const digitBtns = wrapper.findAll('.digit-btn')
      await digitBtns[2].trigger('click') // increment minutes
      await nextTick()
      expect(wrapper.findAll('.digit-value')[1].text()).toBe('06')
    })

    it('shows timer ring progress', async () => {
      const wrapper = mountScreen()
      await goToTimer(wrapper)
      const presets = wrapper.findAll('.preset-btn')
      await presets[2].trigger('click') // 5 min
      await nextTick()
      await wrapper.find('.sw-btn.primary').trigger('click')
      await nextTick()
      expect(wrapper.find('.timer-ring').exists()).toBe(true)
      expect(wrapper.find('.ring-progress').exists()).toBe(true)
    })
  })

  describe('Navigation', () => {
    it('navigates home on swipe up on home bar', async () => {
      const wrapper = mountScreen()
      const bar = wrapper.find('.home-bar-area')
      await bar.trigger('mousedown', { clientY: 300 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 220 }))
      window.dispatchEvent(new MouseEvent('mouseup'))
      expect(navLog).toHaveLength(1)
      expect(navLog[0][0]).toEqual({ action: 'home' })
    })

    it('navigates back on swipe right', async () => {
      const wrapper = mountScreen()
      const screen = wrapper.find('.clock-screen')
      await screen.trigger('mousedown', { clientX: 50 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 250 }))
      window.dispatchEvent(new MouseEvent('mouseup'))
      expect(navLog).toHaveLength(1)
      expect(navLog[0][0]).toEqual({ action: 'back' })
    })
  })
})
