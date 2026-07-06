import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from '../App.vue'
import { i18n } from '@micronet/kernel'

vi.mock('maplibre-gl', () => {
  class Map {
    addControl = vi.fn()
    remove = vi.fn()
    setStyle = vi.fn()
    flyTo = vi.fn()
    isStyleLoaded = vi.fn().mockReturnValue(true)
    constructor() {}
  }
  class NavigationControl {}
  class Marker {
    setLngLat = vi.fn().mockReturnThis()
    addTo = vi.fn().mockReturnThis()
    remove = vi.fn()
    constructor() {}
  }
  return { default: { Map, NavigationControl, Marker } }
})

describe('App Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()

    // Mock geolocation for maps tests
    if (!navigator.geolocation) {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: vi.fn().mockImplementation((success: any) => {
            success({ coords: { latitude: 40.7128, longitude: -74.006 } })
          }),
        },
        configurable: true,
      })
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  /** Helper: swipe up on a wrapper element */
  async function swipeUp(wrapper: ReturnType<typeof mount>, selector: string, distance = 100) {
    const el = wrapper.find(selector)
    await el.trigger('mousedown', { clientY: 300 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientY: 300 - distance }))
    window.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()
  }

  /** Helper: swipe up on the home bar to exit the current app */
  async function swipeUpHomeBar(wrapper: ReturnType<typeof mount>, distance = 60) {
    const bar = wrapper.find('.home-bar-area')
    await bar.trigger('mousedown', { clientY: 300 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientY: 300 - distance }))
    window.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()
  }

  /** Helper: swipe down on a wrapper element */
  async function swipeDown(wrapper: ReturnType<typeof mount>, selector: string, distance = 100) {
    const el = wrapper.find(selector)
    await el.trigger('mousedown', { clientY: 200 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientY: 200 + distance }))
    window.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()
  }

  /** Helper: find app icon button by name */
  function findAppIcon(wrapper: ReturnType<typeof mount>, name: string) {
    return wrapper.findAll('.app-icon').find(el => el.find('.app-name').text() === name)
  }

  it('starts on lock screen', () => {
    const wrapper = mount(App, { global: { plugins: [i18n] } })
    expect(wrapper.find('.lock-screen').exists()).toBe(true)
    expect(wrapper.find('.home-screen').exists()).toBe(false)
  })

  it('unlocks to home screen on swipe', async () => {
    const wrapper = mount(App, { global: { plugins: [i18n] } })
    await swipeUp(wrapper, '.lock-screen')

    expect(wrapper.find('.lock-screen').exists()).toBe(false)
    expect(wrapper.find('.home-screen').exists()).toBe(true)
  })

  it('navigates to settings from home screen', async () => {
    const wrapper = mount(App, { global: { plugins: [i18n] } })
    await swipeUp(wrapper, '.lock-screen')

    await findAppIcon(wrapper, 'Settings')!.trigger('click')
    await nextTick()

    expect(wrapper.find('.settings-screen').exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('Settings')
  })

  it('swiping up on home does nothing (no app switcher)', async () => {
    const wrapper = mount(App, { global: { plugins: [i18n] } })
    await swipeUp(wrapper, '.lock-screen')

    // A plain swipe up on the home screen has no effect
    await swipeUp(wrapper, '.home-screen')

    expect(wrapper.find('.home-screen').exists()).toBe(true)
    expect(wrapper.find('.lock-screen').exists()).toBe(false)
  })

  it('swiping up from settings goes to home screen', async () => {
    const wrapper = mount(App, { global: { plugins: [i18n] } })

    await swipeUp(wrapper, '.lock-screen')
    await findAppIcon(wrapper, 'Settings')!.trigger('click')
    await nextTick()

    await swipeUpHomeBar(wrapper)

    expect(wrapper.find('.settings-screen').exists()).toBe(false)
    expect(wrapper.find('.home-screen').exists()).toBe(true)
  })

  it('swiping down from settings goes to lock screen', async () => {
    const wrapper = mount(App, { global: { plugins: [i18n] } })

    await swipeUp(wrapper, '.lock-screen')
    await findAppIcon(wrapper, 'Settings')!.trigger('click')
    await nextTick()

    await swipeDown(wrapper, '.settings-screen')

    expect(wrapper.find('.lock-screen').exists()).toBe(true)
  })

  it('home bar swipe up navigates to lock screen', async () => {
    const wrapper = mount(App, { global: { plugins: [i18n] } })
    await swipeUp(wrapper, '.lock-screen')

    const bar = wrapper.find('.home-bar-area')
    bar.element.dispatchEvent(new TouchEvent('touchstart', {
      touches: [{ clientY: 300 } as Touch],
    }))
    bar.element.dispatchEvent(new TouchEvent('touchmove', {
      touches: [{ clientY: 250 } as Touch],
    }))
    bar.element.dispatchEvent(new TouchEvent('touchend', { touches: [] }))
    await nextTick()

    expect(wrapper.find('.lock-screen').exists()).toBe(true)
  })

  it('does not navigate on short swipe from lock screen', async () => {
    const wrapper = mount(App, { global: { plugins: [i18n] } })
    const lockScreen = wrapper.find('.lock-screen')

    await lockScreen.trigger('mousedown', { clientY: 300 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientY: 260 }))
    window.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()

    expect(wrapper.find('.lock-screen').exists()).toBe(true)
  })

  it('swiping up on camera opened from lock returns to home', async () => {
    const wrapper = mount(App, { global: { plugins: [i18n] } })

    // Open the camera directly from the lock screen (stack: lock, camera)
    await wrapper.find('[aria-label="Camera"]').trigger('click')
    await nextTick()
    expect(wrapper.find('.camera-screen').exists()).toBe(true)

    // Swipe up on the home bar — should close camera and return to home
    await swipeUpHomeBar(wrapper)

    expect(wrapper.find('.camera-screen').exists()).toBe(false)
    expect(wrapper.find('.home-screen').exists()).toBe(true)
  })

  it('navigating from lock to camera then swiping up returns to home', async () => {
    const wrapper = mount(App, { global: { plugins: [i18n] } })

    await wrapper.find('[aria-label="Camera"]').trigger('click')
    await nextTick()
    expect(wrapper.find('.camera-screen').exists()).toBe(true)

    await swipeUpHomeBar(wrapper)

    expect(wrapper.find('.camera-screen').exists()).toBe(false)
    expect(wrapper.find('.home-screen').exists()).toBe(true)
  })

  it('full navigation cycle: lock to home to settings back to home to lock', async () => {
    const wrapper = mount(App, { global: { plugins: [i18n] } })

    await swipeUp(wrapper, '.lock-screen')
    expect(wrapper.find('.home-screen').exists()).toBe(true)

    await findAppIcon(wrapper, 'Settings')!.trigger('click')
    await nextTick()
    expect(wrapper.find('.settings-screen').exists()).toBe(true)

    await swipeUpHomeBar(wrapper)
    expect(wrapper.find('.home-screen').exists()).toBe(true)

    await swipeDown(wrapper, '.home-screen')
    expect(wrapper.find('.lock-screen').exists()).toBe(true)
  })

  it('double-tap camera button does not cause duplicate navigation', async () => {
    const wrapper = mount(App, { global: { plugins: [i18n] } })

    await swipeUp(wrapper, '.lock-screen')
    const cameraBtn = findAppIcon(wrapper, 'Camera')!
    await cameraBtn.trigger('click')
    await cameraBtn.trigger('click')
    await nextTick()

    expect(wrapper.find('.camera-screen').exists()).toBe(true)
    expect(wrapper.find('.home-screen').exists()).toBe(false)
  })

  it('navigating to photos from home screen', async () => {
    const wrapper = mount(App, { global: { plugins: [i18n] } })

    await swipeUp(wrapper, '.lock-screen')
    await findAppIcon(wrapper, 'Photos')!.trigger('click')
    await nextTick()

    expect(wrapper.find('.photos-screen').exists()).toBe(true)

    await swipeUpHomeBar(wrapper)
    expect(wrapper.find('.home-screen').exists()).toBe(true)
  })

  it('navigating to maps from home screen', async () => {
    const wrapper = mount(App, { global: { plugins: [i18n] } })

    await swipeUp(wrapper, '.lock-screen')
    await findAppIcon(wrapper, 'Maps')!.trigger('click')
    await nextTick()
    await vi.advanceTimersByTimeAsync(200)

    expect(wrapper.find('.maps-screen').exists()).toBe(true)

    // MapsScreen uses a back button, not swipe gestures
    const backBtn = wrapper.find('.back-btn')
    await backBtn.trigger('click')
    await nextTick()

    expect(wrapper.find('.home-screen').exists()).toBe(true)
  })

  it('navigating to calendar from home screen', async () => {
    const wrapper = mount(App, { global: { plugins: [i18n] } })

    await swipeUp(wrapper, '.lock-screen')
    await findAppIcon(wrapper, 'Calendar')!.trigger('click')
    await nextTick()

    expect(wrapper.find('.calendar-screen').exists()).toBe(true)

    await swipeUpHomeBar(wrapper)
    expect(wrapper.find('.home-screen').exists()).toBe(true)
  })
})
