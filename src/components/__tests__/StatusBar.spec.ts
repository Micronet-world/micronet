import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import StatusBar from '../StatusBar.vue'

describe('StatusBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders time in HH:MM format', async () => {
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30))
    const wrapper = mount(StatusBar)
    await nextTick()
    expect(wrapper.find('.time').text()).toBe('14:30')
  })

  it('pads single-digit hours and minutes', async () => {
    vi.setSystemTime(new Date(2025, 0, 15, 9, 5))
    const wrapper = mount(StatusBar)
    await nextTick()
    expect(wrapper.find('.time').text()).toBe('09:05')
  })

  it('renders the Dynamic Island', () => {
    const wrapper = mount(StatusBar)
    expect(wrapper.find('.island').exists()).toBe(true)
  })

  it('renders wifi SVG icon', () => {
    const wrapper = mount(StatusBar)
    const icons = wrapper.find('.icons')
    expect(icons.find('svg.icon').exists()).toBe(true)
  })

  it('renders battery with fill and cap', () => {
    const wrapper = mount(StatusBar)
    expect(wrapper.find('.battery-body').exists()).toBe(true)
    expect(wrapper.find('.battery-fill').exists()).toBe(true)
    expect(wrapper.find('.battery-cap').exists()).toBe(true)
  })

  it('updates time every second', async () => {
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30, 0))
    const wrapper = mount(StatusBar)
    await nextTick()
    expect(wrapper.find('.time').text()).toBe('14:30')

    vi.setSystemTime(new Date(2025, 0, 15, 14, 31, 0))
    vi.advanceTimersByTime(1000)
    await nextTick()
    expect(wrapper.find('.time').text()).toBe('14:31')
  })

  it('cleans up interval on unmount', () => {
    const spy = vi.spyOn(globalThis, 'clearInterval')
    const wrapper = mount(StatusBar)
    wrapper.unmount()
    expect(spy).toHaveBeenCalled()
  })
})
