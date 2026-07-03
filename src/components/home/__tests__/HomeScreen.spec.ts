import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import HomeScreen from '../HomeScreen.vue'

describe('HomeScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders StatusBar and app grid', () => {
    const wrapper = mount(HomeScreen)
    expect(wrapper.find('.home-screen').exists()).toBe(true)
    expect(wrapper.find('.app-grid').exists()).toBe(true)
  })

  it('renders Settings app icon', () => {
    const wrapper = mount(HomeScreen)
    const allIcons = wrapper.findAll('.app-icon')
    const settingsBtn = allIcons.find(el => el.find('.app-name').text() === 'Settings')
    expect(settingsBtn).toBeDefined()
    expect(settingsBtn!.find('.app-name').text()).toBe('Settings')
  })

  it('renders home bar', () => {
    const wrapper = mount(HomeScreen)
    expect(wrapper.find('.home-bar').exists()).toBe(true)
    expect(wrapper.find('.home-bar-area').exists()).toBe(true)
  })

  it('emits open-settings when settings button clicked', async () => {
    const wrapper = mount(HomeScreen)
    const allIcons = wrapper.findAll('.app-icon')
    const settingsBtn = allIcons.find(el => el.find('.app-name').text() === 'Settings')
    await settingsBtn!.trigger('click')
    expect(wrapper.emitted('open-settings')).toHaveLength(1)
  })

  describe('screen swipe gesture (mouse)', () => {
    it('emits go-lock on downward swipe > 80px', async () => {
      const wrapper = mount(HomeScreen)
      const screen = wrapper.find('.home-screen')

      await screen.trigger('mousedown', { clientY: 200 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 300 }))
      window.dispatchEvent(new MouseEvent('mouseup'))

      expect(wrapper.emitted('go-lock')).toHaveLength(1)
    })

    it('emits show-cards on upward swipe > 80px', async () => {
      const wrapper = mount(HomeScreen)
      const screen = wrapper.find('.home-screen')

      await screen.trigger('mousedown', { clientY: 300 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 200 }))
      window.dispatchEvent(new MouseEvent('mouseup'))

      expect(wrapper.emitted('show-cards')).toHaveLength(1)
    })

    it('does NOT emit on short swipe', async () => {
      const wrapper = mount(HomeScreen)
      const screen = wrapper.find('.home-screen')

      await screen.trigger('mousedown', { clientY: 300 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 260 }))
      window.dispatchEvent(new MouseEvent('mouseup'))

      expect(wrapper.emitted('go-lock')).toBeUndefined()
      expect(wrapper.emitted('show-cards')).toBeUndefined()
    })
  })

  describe('screen swipe gesture (touch)', () => {
    it('emits go-lock on downward touch swipe', () => {
      const wrapper = mount(HomeScreen)
      const screen = wrapper.find('.home-screen')

      screen.element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [{ clientY: 200 } as Touch],
      }))
      screen.element.dispatchEvent(new TouchEvent('touchmove', {
        touches: [{ clientY: 300 } as Touch],
      }))
      screen.element.dispatchEvent(new TouchEvent('touchend', { touches: [] }))

      expect(wrapper.emitted('go-lock')).toHaveLength(1)
    })

    it('emits show-cards on upward touch swipe', () => {
      const wrapper = mount(HomeScreen)
      const screen = wrapper.find('.home-screen')

      screen.element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [{ clientY: 300 } as Touch],
      }))
      screen.element.dispatchEvent(new TouchEvent('touchmove', {
        touches: [{ clientY: 200 } as Touch],
      }))
      screen.element.dispatchEvent(new TouchEvent('touchend', { touches: [] }))

      expect(wrapper.emitted('show-cards')).toHaveLength(1)
    })
  })

  describe('home bar swipe gesture', () => {
    it('emits go-lock on home bar swipe up > 40px (touch)', () => {
      const wrapper = mount(HomeScreen)
      const bar = wrapper.find('.home-bar-area')

      bar.element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [{ clientY: 300 } as Touch],
      }))
      bar.element.dispatchEvent(new TouchEvent('touchmove', {
        touches: [{ clientY: 250 } as Touch],
      }))
      bar.element.dispatchEvent(new TouchEvent('touchend', { touches: [] }))

      expect(wrapper.emitted('go-lock')).toHaveLength(1)
    })

    it('does NOT emit on short home bar swipe', () => {
      const wrapper = mount(HomeScreen)
      const bar = wrapper.find('.home-bar-area')

      bar.element.dispatchEvent(new TouchEvent('touchstart', {
        touches: [{ clientY: 300 } as Touch],
      }))
      bar.element.dispatchEvent(new TouchEvent('touchmove', {
        touches: [{ clientY: 270 } as Touch],
      }))
      bar.element.dispatchEvent(new TouchEvent('touchend', { touches: [] }))

      expect(wrapper.emitted('go-lock')).toBeUndefined()
    })
  })

  it('applies dragging class during drag', async () => {
    const wrapper = mount(HomeScreen)
    const screen = wrapper.find('.home-screen')

    await screen.trigger('mousedown', { clientY: 300 })
    expect(screen.classes()).toContain('dragging')

    window.dispatchEvent(new MouseEvent('mouseup'))
    await flushPromises()
    expect(screen.classes()).not.toContain('dragging')
  })

  it('cleans up global mouse listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(HomeScreen)
    wrapper.unmount()

    const calls = removeSpy.mock.calls.map(c => c[0])
    expect(calls).toContain('mousemove')
    expect(calls).toContain('mouseup')
  })
})
