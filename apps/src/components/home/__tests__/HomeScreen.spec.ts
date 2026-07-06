import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import HomeScreen from '../HomeScreen.vue'
import { i18n } from '@micronet/kernel'
import { onNav, resetBus, type NavRequest } from '@micronet/kernel'

describe('HomeScreen', () => {
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

  it('renders StatusBar and app grid', () => {
    const wrapper = mount(HomeScreen, { global: { plugins: [i18n] } })
    expect(wrapper.find('.home-screen').exists()).toBe(true)
    expect(wrapper.find('.app-grid').exists()).toBe(true)
  })

  it('renders Settings app icon', () => {
    const wrapper = mount(HomeScreen, { global: { plugins: [i18n] } })
    const allIcons = wrapper.findAll('.app-icon')
    const settingsBtn = allIcons.find(el => el.find('.app-name').text() === 'Settings')
    expect(settingsBtn).toBeDefined()
    expect(settingsBtn!.find('.app-name').text()).toBe('Settings')
  })

  it('renders home bar', () => {
    const wrapper = mount(HomeScreen, { global: { plugins: [i18n] } })
    expect(wrapper.find('.home-bar').exists()).toBe(true)
    expect(wrapper.find('.home-bar-area').exists()).toBe(true)
  })

  it('navigates to settings when settings button clicked', async () => {
    const wrapper = mount(HomeScreen, { global: { plugins: [i18n] } })
    const allIcons = wrapper.findAll('.app-icon')
    const settingsBtn = allIcons.find(el => el.find('.app-name').text() === 'Settings')
    await settingsBtn!.trigger('click')
    expect(navLog).toHaveLength(1)
    expect(navLog[0][0]).toEqual({ action: 'push', screen: 'settings' })
  })

  describe('screen swipe gesture (mouse)', () => {
    it('locks on downward swipe > 80px', async () => {
      const wrapper = mount(HomeScreen, { global: { plugins: [i18n] } })
      const screen = wrapper.find('.home-screen')

      await screen.trigger('mousedown', { clientY: 200 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 300 }))
      window.dispatchEvent(new MouseEvent('mouseup'))

      expect(navLog).toHaveLength(1)
      expect(navLog[0][0]).toEqual({ action: 'lock' })
    })

    it('does NOT lock on upward swipe', async () => {
      const wrapper = mount(HomeScreen, { global: { plugins: [i18n] } })
      const screen = wrapper.find('.home-screen')

      await screen.trigger('mousedown', { clientY: 300 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 200 }))
      window.dispatchEvent(new MouseEvent('mouseup'))

      expect(navLog).toHaveLength(0)
    })

    it('does NOT navigate on short swipe', async () => {
      const wrapper = mount(HomeScreen, { global: { plugins: [i18n] } })
      const screen = wrapper.find('.home-screen')

      await screen.trigger('mousedown', { clientY: 300 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 260 }))
      window.dispatchEvent(new MouseEvent('mouseup'))

      expect(navLog).toHaveLength(0)
    })
  })

  describe('screen swipe gesture (touch)', () => {
    it('locks on downward touch swipe', () => {
      const wrapper = mount(HomeScreen, { global: { plugins: [i18n] } })
      const screen = wrapper.find('.home-screen')

      screen.element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [{ clientY: 200 } as Touch],
      }))
      screen.element.dispatchEvent(new TouchEvent('touchmove', {
        touches: [{ clientY: 300 } as Touch],
      }))
      screen.element.dispatchEvent(new TouchEvent('touchend', { touches: [] }))

      expect(navLog).toHaveLength(1)
      expect(navLog[0][0]).toEqual({ action: 'lock' })
    })

    it('does NOT lock on upward touch swipe', () => {
      const wrapper = mount(HomeScreen, { global: { plugins: [i18n] } })
      const screen = wrapper.find('.home-screen')

      screen.element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [{ clientY: 300 } as Touch],
      }))
      screen.element.dispatchEvent(new TouchEvent('touchmove', {
        touches: [{ clientY: 200 } as Touch],
      }))
      screen.element.dispatchEvent(new TouchEvent('touchend', { touches: [] }))

      expect(navLog).toHaveLength(0)
    })
  })

  describe('home bar swipe gesture', () => {
    it('locks on home bar swipe up > 40px (touch)', () => {
      const wrapper = mount(HomeScreen, { global: { plugins: [i18n] } })
      const bar = wrapper.find('.home-bar-area')

      bar.element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [{ clientY: 300 } as Touch],
      }))
      bar.element.dispatchEvent(new TouchEvent('touchmove', {
        touches: [{ clientY: 250 } as Touch],
      }))
      bar.element.dispatchEvent(new TouchEvent('touchend', { touches: [] }))

      expect(navLog).toHaveLength(1)
      expect(navLog[0][0]).toEqual({ action: 'lock' })
    })

    it('does NOT navigate on short home bar swipe', () => {
      const wrapper = mount(HomeScreen, { global: { plugins: [i18n] } })
      const bar = wrapper.find('.home-bar-area')

      bar.element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [{ clientY: 300 } as Touch],
      }))
      bar.element.dispatchEvent(new TouchEvent('touchmove', {
        touches: [{ clientY: 270 } as Touch],
      }))
      bar.element.dispatchEvent(new TouchEvent('touchend', { touches: [] }))

      expect(navLog).toHaveLength(0)
    })
  })

  it('applies dragging class during drag', async () => {
    const wrapper = mount(HomeScreen, { global: { plugins: [i18n] } })
    const screen = wrapper.find('.home-screen')

    await screen.trigger('mousedown', { clientY: 300 })
    expect(screen.classes()).toContain('dragging')

    window.dispatchEvent(new MouseEvent('mouseup'))
    await flushPromises()
    expect(screen.classes()).not.toContain('dragging')
  })

  it('cleans up global mouse listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(HomeScreen, { global: { plugins: [i18n] } })
    wrapper.unmount()

    const calls = removeSpy.mock.calls.map(c => c[0])
    expect(calls).toContain('mousemove')
    expect(calls).toContain('mouseup')
  })
})
