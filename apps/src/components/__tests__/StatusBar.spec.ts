import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import StatusBar from '../StatusBar.vue'
import { i18n } from '@micronet/kernel'

describe('StatusBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders status bar container', () => {
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30))
    const wrapper = mount(StatusBar, { global: { plugins: [i18n] } })
    expect(wrapper.find('.status-bar').exists()).toBe(true)
  })

  it('displays time', async () => {
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30))
    const wrapper = mount(StatusBar, { global: { plugins: [i18n] } })
    await nextTick()
    expect(wrapper.find('.time').text()).toBe('14:30')
  })

  it('renders dynamic island', () => {
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30))
    const wrapper = mount(StatusBar, { global: { plugins: [i18n] } })
    expect(wrapper.find('.island').exists()).toBe(true)
  })

  it('renders wifi icon', () => {
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30))
    const wrapper = mount(StatusBar, { global: { plugins: [i18n] } })
    expect(wrapper.find('.icons svg').exists()).toBe(true)
  })

  it('renders battery indicator', () => {
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30))
    const wrapper = mount(StatusBar, { global: { plugins: [i18n] } })
    expect(wrapper.find('.battery').exists()).toBe(true)
    expect(wrapper.find('.battery-body').exists()).toBe(true)
    expect(wrapper.find('.battery-fill').exists()).toBe(true)
    expect(wrapper.find('.battery-cap').exists()).toBe(true)
  })
})
