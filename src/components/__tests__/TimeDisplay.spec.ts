import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TimeDisplay from '../TimeDisplay.vue'
import { i18n } from '../../test-setup'

describe('TimeDisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders hours and minutes separately', async () => {
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30))
    const wrapper = mount(TimeDisplay, { global: { plugins: [i18n] } })
    await nextTick()
    const digits = wrapper.findAll('.digit')
    expect(digits[0].text()).toBe('14')
    expect(digits[1].text()).toBe('30')
  })

  it('pads single-digit values', async () => {
    vi.setSystemTime(new Date(2025, 0, 15, 9, 5))
    const wrapper = mount(TimeDisplay, { global: { plugins: [i18n] } })
    await nextTick()
    const digits = wrapper.findAll('.digit')
    expect(digits[0].text()).toBe('09')
    expect(digits[1].text()).toBe('05')
  })

  it('renders date string with day, month, and date', async () => {
    vi.setSystemTime(new Date(2025, 0, 15, 12, 0)) // Wednesday, January 15
    const wrapper = mount(TimeDisplay, { global: { plugins: [i18n] } })
    await nextTick()
    const date = wrapper.find('.date')
    expect(date.text()).toBe('Wednesday, January 15')
  })

  it('renders the colon separator', () => {
    vi.setSystemTime(new Date(2025, 0, 15, 12, 0))
    const wrapper = mount(TimeDisplay, { global: { plugins: [i18n] } })
    expect(wrapper.find('.colon').text()).toBe(':')
  })

  it('updates every second', async () => {
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30, 0))
    const wrapper = mount(TimeDisplay, { global: { plugins: [i18n] } })
    await nextTick()
    expect(wrapper.findAll('.digit')[0].text()).toBe('14')

    vi.setSystemTime(new Date(2025, 0, 15, 15, 0, 0))
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(wrapper.findAll('.digit')[0].text()).toBe('15')
  })

  it('cleans up interval on unmount', () => {
    const spy = vi.spyOn(globalThis, 'clearInterval')
    const wrapper = mount(TimeDisplay, { global: { plugins: [i18n] } })
    wrapper.unmount()
    expect(spy).toHaveBeenCalled()
  })

  it('renders correct day for Saturday', async () => {
    vi.setSystemTime(new Date(2025, 0, 18, 10, 0)) // Saturday, January 18
    const wrapper = mount(TimeDisplay, { global: { plugins: [i18n] } })
    await nextTick()
    expect(wrapper.find('.date').text()).toContain('Saturday')
  })

  it('renders correct month for December', async () => {
    vi.setSystemTime(new Date(2025, 11, 25, 10, 0))
    const wrapper = mount(TimeDisplay, { global: { plugins: [i18n] } })
    await nextTick()
    expect(wrapper.find('.date').text()).toContain('December')
  })
})
