import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CameraScreen from '../CameraScreen.vue'
import { i18n, onNav, resetBus } from '@micronet/kernel'
import type { NavRequest } from '@micronet/kernel'

describe('CameraScreen', () => {
  let navLog: NavRequest[][]
  let offNav: () => void

  beforeEach(() => {
    vi.useFakeTimers()
    resetBus()
    navLog = []
    offNav = onNav((msg) => { navLog.push([msg]) })
  })

  afterEach(() => {
    offNav()
    resetBus()
    vi.useRealTimers()
  })

  it('renders camera screen container', async () => {
    const wrapper = mount(CameraScreen, { global: { plugins: [i18n] } })
    await nextTick()
    expect(wrapper.find('.camera-screen').exists()).toBe(true)
  })

  it('shows error message when camera is not available', async () => {
    const orig = navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(
          Object.assign(new Error('not found'), { name: 'NotFoundError' })
        ),
      },
      configurable: true,
    })

    const wrapper = mount(CameraScreen, { global: { plugins: [i18n] } })
    await nextTick()
    await nextTick()

    expect(wrapper.find('.camera-error').exists()).toBe(true)
    expect(wrapper.find('.camera-error p').text()).toBeTruthy()

    Object.defineProperty(navigator, 'mediaDevices', { value: orig, configurable: true })
  })

  it('renders photo/video mode toggle', async () => {
    const wrapper = mount(CameraScreen, { global: { plugins: [i18n] } })
    await nextTick()

    const modeBtns = wrapper.findAll('.mode-btn')
    expect(modeBtns.length).toBe(2)
    expect(modeBtns[0].text()).toBe('PHOTO')
    expect(modeBtns[1].text()).toBe('VIDEO')
  })

  it('renders flash mode buttons', async () => {
    const wrapper = mount(CameraScreen, { global: { plugins: [i18n] } })
    await nextTick()

    const flashBtn = wrapper.find('button[aria-label="Flash"]')
    expect(flashBtn.exists()).toBe(true)
  })

  it('renders top bar', async () => {
    const wrapper = mount(CameraScreen, { global: { plugins: [i18n] } })
    await nextTick()

    expect(wrapper.find('.camera-screen').exists()).toBe(true)
    expect(wrapper.find('.top-bar').exists()).toBe(true)
  })

  it('back button navigates home', async () => {
    const wrapper = mount(CameraScreen, { global: { plugins: [i18n] } })
    await nextTick()
    await nextTick()

    // Swipe up on home bar triggers goHome()
    const bar = wrapper.find('.home-bar-area')
    await bar.trigger('mousedown', { clientY: 300 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientY: 220 }))
    window.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()

    expect(navLog.length).toBeGreaterThanOrEqual(1)
    expect(navLog.some(msgs => msgs.some(m => m.action === 'home'))).toBe(true)
  })

  it('renders grid toggle button', async () => {
    const wrapper = mount(CameraScreen, { global: { plugins: [i18n] } })
    await nextTick()

    const gridBtn = wrapper.find('button[aria-label="Grid"]')
    expect(gridBtn.exists()).toBe(true)
  })

  it('renders timer selector', async () => {
    const wrapper = mount(CameraScreen, { global: { plugins: [i18n] } })
    await nextTick()

    const timerBtn = wrapper.find('button[aria-label="Timer"]')
    expect(timerBtn.exists()).toBe(true)
  })
})
