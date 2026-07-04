import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from '../App.vue'

describe('App Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
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
    const wrapper = mount(App)
    expect(wrapper.find('.lock-screen').exists()).toBe(true)
    expect(wrapper.find('.home-screen').exists()).toBe(false)
  })

  it('unlocks to home screen on swipe', async () => {
    const wrapper = mount(App)
    await swipeUp(wrapper, '.lock-screen')

    expect(wrapper.find('.lock-screen').exists()).toBe(false)
    expect(wrapper.find('.home-screen').exists()).toBe(true)
  })

  it('navigates to settings from home screen', async () => {
    const wrapper = mount(App)
    await swipeUp(wrapper, '.lock-screen')

    await findAppIcon(wrapper, 'Settings')!.trigger('click')
    await nextTick()

    expect(wrapper.find('.settings-screen').exists()).toBe(true)
    expect(wrapper.find('h1').text()).toBe('Settings')
  })

  it('swiping up on home does not expand cards (requires indicator hold)', async () => {
    const wrapper = mount(App)
    await swipeUp(wrapper, '.lock-screen')

    // A plain swipe up on the home screen no longer opens the background manager
    await swipeUp(wrapper, '.home-screen')

    expect(wrapper.find('.home-screen').exists()).toBe(true)
    expect(wrapper.find('.lock-screen').exists()).toBe(false)
    expect(wrapper.find('.current-screen.expanded').exists()).toBe(false)
  })

  it('swiping up on the home indicator and holding expands the card stack', async () => {
    const wrapper = mount(App)
    await swipeUp(wrapper, '.lock-screen')
    expect(wrapper.find('.home-screen').exists()).toBe(true)

    const bar = wrapper.find('.home-bar-area')
    bar.element.dispatchEvent(new TouchEvent('touchstart', {
      touches: [{ clientY: 300 } as Touch],
    }))
    bar.element.dispatchEvent(new TouchEvent('touchmove', {
      touches: [{ clientY: 250 } as Touch],
    }))
    // Pausing for holdDelay fires the hold before the finger lifts
    vi.advanceTimersByTime(250)
    await nextTick()

    // Background manager is now expanded (current screen lifts)
    expect(wrapper.find('.current-screen.expanded').exists()).toBe(true)

    bar.element.dispatchEvent(new TouchEvent('touchend', { touches: [] }))
    await nextTick()

    // Lifting after the hold keeps it expanded (no navigation back to lock)
    expect(wrapper.find('.current-screen.expanded').exists()).toBe(true)
    expect(wrapper.find('.lock-screen').exists()).toBe(false)
  })

  it('swiping up on settings expands card stack', async () => {
    const wrapper = mount(App)

    // Unlock → home → settings (stack: lock, home, settings)
    await swipeUp(wrapper, '.lock-screen')
    await findAppIcon(wrapper, 'Settings')!.trigger('click')
    await nextTick()

    // Swipe up on settings to expand cards
    await swipeUp(wrapper, '.settings-screen')
    await nextTick()

    // Cards should be expanded — home card visible behind settings
    expect(wrapper.find('.backdrop').exists()).toBe(true)
    const expandedCards = wrapper.findAll('.background-card.expanded')
    expect(expandedCards.length).toBeGreaterThan(0)
  })

  it('clicking backdrop collapses expanded cards', async () => {
    const wrapper = mount(App)

    // Navigate to settings (stack: lock, home, settings)
    await swipeUp(wrapper, '.lock-screen')
    await findAppIcon(wrapper, 'Settings')!.trigger('click')
    await nextTick()

    // Expand cards
    await swipeUp(wrapper, '.settings-screen')
    await nextTick()
    expect(wrapper.find('.backdrop').exists()).toBe(true)

    // Click backdrop to collapse
    await wrapper.find('.backdrop').trigger('click')
    await nextTick()

    expect(wrapper.find('.backdrop').exists()).toBe(false)
    expect(wrapper.findAll('.background-card.expanded')).toHaveLength(0)
  })

  it('clicking a card from expanded stack navigates to that screen', async () => {
    const wrapper = mount(App)

    // Navigate: home → settings (stack: lock, home, settings)
    await swipeUp(wrapper, '.lock-screen')
    await findAppIcon(wrapper, 'Settings')!.trigger('click')
    await nextTick()

    // Expand cards on settings
    await swipeUp(wrapper, '.settings-screen')
    await nextTick()

    // Click the Home card
    const homeCard = wrapper.findAll('.background-card').find(
      c => c.find('.card-label').text() === 'Home'
    )
    expect(homeCard).toBeDefined()
    await homeCard!.trigger('click')
    await nextTick()

    // Should navigate to home, settings removed from stack
    expect(wrapper.find('.home-screen').exists()).toBe(true)
    expect(wrapper.findAll('.background-card.expanded')).toHaveLength(0)
  })

  it('swiping down from settings goes to lock screen', async () => {
    const wrapper = mount(App)

    await swipeUp(wrapper, '.lock-screen')
    await findAppIcon(wrapper, 'Settings')!.trigger('click')
    await nextTick()

    await swipeDown(wrapper, '.settings-screen')

    expect(wrapper.find('.lock-screen').exists()).toBe(true)
  })

  it('home bar swipe up navigates to lock screen', async () => {
    const wrapper = mount(App)
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

  it('full flow: lock → home → settings → expand cards → click home card → home', async () => {
    const wrapper = mount(App)

    // 1. Unlock → home
    await swipeUp(wrapper, '.lock-screen')
    expect(wrapper.find('.home-screen').exists()).toBe(true)

    // 2. Open settings (stack: lock, home, settings)
    await findAppIcon(wrapper, 'Settings')!.trigger('click')
    await nextTick()
    expect(wrapper.find('.settings-screen').exists()).toBe(true)

    // 3. Expand cards on settings
    await swipeUp(wrapper, '.settings-screen')
    await nextTick()
    expect(wrapper.find('.backdrop').exists()).toBe(true)

    // 4. Click Home card
    const homeCard = wrapper.findAll('.background-card').find(
      c => c.find('.card-label').text() === 'Home'
    )
    expect(homeCard).toBeDefined()
    await homeCard!.trigger('click')
    await nextTick()

    // 5. Back on home, cards collapsed
    expect(wrapper.find('.home-screen').exists()).toBe(true)
    expect(wrapper.find('.backdrop').exists()).toBe(false)
  })

  it('does not navigate on short swipe from lock screen', async () => {
    const wrapper = mount(App)
    const lockScreen = wrapper.find('.lock-screen')

    await lockScreen.trigger('mousedown', { clientY: 300 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientY: 260 }))
    window.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()

    expect(wrapper.find('.lock-screen').exists()).toBe(true)
  })

  it('card stack is not expanded by default', () => {
    const wrapper = mount(App)
    expect(wrapper.find('.backdrop').exists()).toBe(false)
    expect(wrapper.findAll('.background-card.expanded')).toHaveLength(0)
  })

  it('swiping up on camera opened from lock returns to home', async () => {
    const wrapper = mount(App)

    // Open the camera directly from the lock screen (stack: lock, camera)
    await wrapper.find('[aria-label="Camera"]').trigger('click')
    await nextTick()
    expect(wrapper.find('.camera-screen').exists()).toBe(true)

    // Swipe up on the camera — should close it and return to home
    await swipeUp(wrapper, '.camera-screen')

    expect(wrapper.find('.camera-screen').exists()).toBe(false)
    expect(wrapper.find('.home-screen').exists()).toBe(true)
  })
})
