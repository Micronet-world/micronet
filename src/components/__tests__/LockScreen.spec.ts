import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import LockScreen from '../LockScreen.vue'

describe('LockScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders child components', async () => {
    const wrapper = mount(LockScreen)
    await nextTick()
    expect(wrapper.find('.lock-screen').exists()).toBe(true)
    expect(wrapper.find('.content').exists()).toBe(true)
    expect(wrapper.find('.main').exists()).toBe(true)
    expect(wrapper.find('.bottom').exists()).toBe(true)
  })

  describe('mouse swipe gesture', () => {
    it('does NOT emit unlock on short swipe', async () => {
      const wrapper = mount(LockScreen)
      const screen = wrapper.find('.lock-screen')

      await screen.trigger('mousedown', { clientY: 300 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 250 }))
      window.dispatchEvent(new MouseEvent('mouseup'))

      expect(wrapper.emitted('unlock')).toBeUndefined()
    })

    it('emits unlock on sufficient upward swipe (> 80px)', async () => {
      const wrapper = mount(LockScreen)
      const screen = wrapper.find('.lock-screen')

      await screen.trigger('mousedown', { clientY: 300 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 200 }))
      window.dispatchEvent(new MouseEvent('mouseup'))

      expect(wrapper.emitted('unlock')).toHaveLength(1)
    })

    it('does NOT emit unlock on downward swipe', async () => {
      const wrapper = mount(LockScreen)
      const screen = wrapper.find('.lock-screen')

      await screen.trigger('mousedown', { clientY: 200 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 300 }))
      window.dispatchEvent(new MouseEvent('mouseup'))

      expect(wrapper.emitted('unlock')).toBeUndefined()
    })

    it('resets dragProgress after mouseup', async () => {
      const wrapper = mount(LockScreen)
      const screen = wrapper.find('.lock-screen')

      await screen.trigger('mousedown', { clientY: 300 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 200 }))
      await nextTick()

      const content = wrapper.find('.content')
      const styleDuring = content.attributes('style')
      expect(styleDuring).toContain('translateY')

      window.dispatchEvent(new MouseEvent('mouseup'))
      await nextTick()

      const styleAfter = content.attributes('style')
      expect(styleAfter).toContain('translateY(0px)')
    })
  })

  describe('touch swipe gesture', () => {
    it('emits unlock on sufficient upward swipe via touch', async () => {
      const wrapper = mount(LockScreen)
      const screen = wrapper.find('.lock-screen')

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientY: 300 } as Touch],
      })
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientY: 200 } as Touch],
      })
      const touchEnd = new TouchEvent('touchend', { touches: [] })

      screen.element.dispatchEvent(touchStart)
      screen.element.dispatchEvent(touchMove)
      screen.element.dispatchEvent(touchEnd)

      expect(wrapper.emitted('unlock')).toHaveLength(1)
    })

    it('does NOT emit unlock on short touch swipe', async () => {
      const wrapper = mount(LockScreen)
      const screen = wrapper.find('.lock-screen')

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientY: 300 } as Touch],
      })
      const touchMove = new TouchEvent('touchmove', {
        touches: [{ clientY: 260 } as Touch],
      })
      const touchEnd = new TouchEvent('touchend', { touches: [] })

      screen.element.dispatchEvent(touchStart)
      screen.element.dispatchEvent(touchMove)
      screen.element.dispatchEvent(touchEnd)

      expect(wrapper.emitted('unlock')).toBeUndefined()
    })
  })

  it('applies dragging class during drag', async () => {
    const wrapper = mount(LockScreen)
    const screen = wrapper.find('.lock-screen')

    await screen.trigger('mousedown', { clientY: 300 })
    expect(screen.classes()).toContain('dragging')

    window.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()
    expect(screen.classes()).not.toContain('dragging')
  })

  it('content style reflects dragProgress', async () => {
    const wrapper = mount(LockScreen)
    const screen = wrapper.find('.lock-screen')
    const content = wrapper.find('.content')

    await screen.trigger('mousedown', { clientY: 300 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientY: 225 }))
    await nextTick()

    const style = content.attributes('style')
    expect(style).toContain('translateY(-15px)') // 0.5 * 30 = 15
    expect(style).toContain('opacity: 0.9') // 1 - 0.5 * 0.2 = 0.9
  })

  it('cleans up global mouse listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(LockScreen)
    wrapper.unmount()

    const calls = removeSpy.mock.calls.map(c => c[0])
    expect(calls).toContain('mousemove')
    expect(calls).toContain('mouseup')
  })

  it('ignores mousemove when not dragging', async () => {
    const wrapper = mount(LockScreen)
    window.dispatchEvent(new MouseEvent('mousemove', { clientY: 100 }))

    const content = wrapper.find('.content')
    const style = content.attributes('style')
    expect(style).toContain('translateY(0px)')
  })

  it('ignores mouseup when not dragging', async () => {
    const wrapper = mount(LockScreen)
    window.dispatchEvent(new MouseEvent('mouseup'))
    expect(wrapper.emitted('unlock')).toBeUndefined()
  })
})
