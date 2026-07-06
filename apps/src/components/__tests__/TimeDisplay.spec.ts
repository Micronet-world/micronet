import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TimeDisplay from '../TimeDisplay.vue'
import { i18n } from '@micronet/kernel'

describe('TimeDisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders time display container', () => {
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30))
    const wrapper = mount(TimeDisplay, { global: { plugins: [i18n] } })
    expect(wrapper.find('.time-display').exists()).toBe(true)
  })

  it('displays current hours and minutes', async () => {
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30))
    const wrapper = mount(TimeDisplay, { global: { plugins: [i18n] } })
    await nextTick()
    expect(wrapper.find('.time').text()).toBe('14:30')
  })

  it('displays a date string', async () => {
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30))
    const wrapper = mount(TimeDisplay, { global: { plugins: [i18n] } })
    await nextTick()
    expect(wrapper.find('.date').exists()).toBe(true)
    expect(wrapper.find('.date').text()).toBeTruthy()
  })

  it('updates time every second', async () => {
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30, 0))
    const wrapper = mount(TimeDisplay, { global: { plugins: [i18n] } })
    await nextTick()
    expect(wrapper.find('.time').text()).toBe('14:30')

    vi.setSystemTime(new Date(2025, 0, 15, 14, 31, 0))
    vi.advanceTimersByTime(1000)
    await nextTick()

    expect(wrapper.find('.time').text()).toBe('14:31')
  })

  it('clears interval on unmount', () => {
    const spy = vi.spyOn(globalThis, 'clearInterval')
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30))
    const wrapper = mount(TimeDisplay, { global: { plugins: [i18n] } })
    wrapper.unmount()
    expect(spy).toHaveBeenCalled()
  })

  it('renders hours with leading zero padding', async () => {
    vi.setSystemTime(new Date(2025, 0, 15, 9, 5))
    const wrapper = mount(TimeDisplay, { global: { plugins: [i18n] } })
    await nextTick()
    expect(wrapper.find('.time').text()).toBe('09:05')
  })

  it('renders responsive CSS classes', () => {
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30))
    const wrapper = mount(TimeDisplay, { global: { plugins: [i18n] } })
    expect(wrapper.find('.date').exists()).toBe(true)
    expect(wrapper.find('.digit').exists()).toBe(true)
    expect(wrapper.find('.colon').exists()).toBe(true)
  })
})
