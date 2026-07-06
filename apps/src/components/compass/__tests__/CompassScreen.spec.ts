import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CompassScreen from '../CompassScreen.vue'
import { i18n, resetBus, onNav } from '@micronet/kernel'
import type { NavRequest } from '@micronet/kernel'

function mountScreen() {
  return mount(CompassScreen, {
    global: { plugins: [i18n] },
  })
}

describe('CompassScreen', () => {
  let navLog: NavRequest[][]
  let offNav: () => void

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 15, 14, 30, 0))
    resetBus()
    navLog = []
    offNav = onNav((msg) => { navLog.push([msg]) })
  })

  afterEach(() => {
    offNav()
    resetBus()
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('renders the compass screen', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.compass-screen').exists()).toBe(true)
    })

    it('renders the header with title', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.header-title').exists()).toBe(true)
      expect(wrapper.find('.header-title').text()).toBeTruthy()
    })

    it('renders the compass SVG', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.compass-svg').exists()).toBe(true)
    })

    it('renders the heading display', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.heading-display').exists()).toBe(true)
      expect(wrapper.find('.heading-degrees').exists()).toBe(true)
      expect(wrapper.find('.heading-direction').exists()).toBe(true)
    })

    it('displays 0 degrees by default', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.heading-degrees').text()).toBe('0')
    })

    it('renders the heading indicator', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.heading-indicator').exists()).toBe(true)
    })

    it('renders the compass needle', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.needle-north').exists()).toBe(true)
      expect(wrapper.find('.needle-south').exists()).toBe(true)
    })

    it('renders the center dot', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.center-dot').exists()).toBe(true)
    })

    it('renders tick marks', () => {
      const wrapper = mountScreen()
      const ticks = wrapper.findAll('.tick-minor, .tick-major')
      expect(ticks.length).toBeGreaterThan(0)
    })

    it('renders major tick marks', () => {
      const wrapper = mountScreen()
      const majorTicks = wrapper.findAll('.tick-major')
      expect(majorTicks.length).toBe(12)
    })

    it('renders cardinal direction labels', () => {
      const wrapper = mountScreen()
      const cardinals = wrapper.findAll('.cardinal-label')
      expect(cardinals.length).toBe(4)
    })

    it('renders intercardinal direction labels', () => {
      const wrapper = mountScreen()
      const intercardinals = wrapper.findAll('.intercardinal-label')
      expect(intercardinals.length).toBe(4)
    })

    it('renders the wallpaper', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.wallpaper').exists()).toBe(true)
    })

    it('renders the home bar', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.home-bar-area').exists()).toBe(true)
      expect(wrapper.find('.home-bar').exists()).toBe(true)
    })
  })

  describe('Heading Display', () => {
    it('shows degree symbol', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.heading-symbol').text()).toBe('°')
    })

    it('displays a cardinal direction', () => {
      const wrapper = mountScreen()
      const dir = wrapper.find('.heading-direction').text()
      expect(dir.length).toBeGreaterThan(0)
    })
  })

  describe('Compass Rose', () => {
    it('has tick labels at 30-degree intervals', () => {
      const wrapper = mountScreen()
      const labels = wrapper.findAll('.tick-label')
      expect(labels.length).toBe(8)
    })

    it('N label has north styling', () => {
      const wrapper = mountScreen()
      const northLabel = wrapper.find('.cardinal-north')
      expect(northLabel.exists()).toBe(true)
      expect(northLabel.text()).toBe('N')
    })

    it('renders compass container', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.compass-container').exists()).toBe(true)
    })
  })

  describe('Lock Heading', () => {
    it('renders the lock button', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.lock-btn').exists()).toBe(true)
    })

    it('lock button is not active by default', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.lock-btn').classes()).not.toContain('active')
    })

    it('toggles lock state on click', async () => {
      const wrapper = mountScreen()
      const lockBtn = wrapper.find('.lock-btn')
      await lockBtn.trigger('click')
      expect(lockBtn.classes()).toContain('active')

      await lockBtn.trigger('click')
      expect(lockBtn.classes()).not.toContain('active')
    })

    it('shows lock icon when unlocked', () => {
      const wrapper = mountScreen()
      const lockBtn = wrapper.find('.lock-btn')
      expect(lockBtn.find('svg').exists()).toBe(true)
    })

    it('changes icon when locked', async () => {
      const wrapper = mountScreen()
      await wrapper.find('.lock-btn').trigger('click')
      expect(wrapper.find('.lock-btn svg').exists()).toBe(true)
    })

    it('direction label changes style when locked', async () => {
      const wrapper = mountScreen()
      await wrapper.find('.lock-btn').trigger('click')
      expect(wrapper.find('.heading-direction').classes()).toContain('locked')
    })
  })

  describe('Navigation', () => {
    it('navigates home on swipe up on home bar', async () => {
      const wrapper = mountScreen()
      const bar = wrapper.find('.home-bar-area')
      await bar.trigger('mousedown', { clientY: 300 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 220 }))
      window.dispatchEvent(new MouseEvent('mouseup'))
      expect(navLog).toHaveLength(1)
      expect(navLog[0][0]).toEqual({ action: 'home' })
    })

    it('navigates back on swipe right', async () => {
      const wrapper = mountScreen()
      const screen = wrapper.find('.compass-screen')
      await screen.trigger('mousedown', { clientX: 50 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 250 }))
      window.dispatchEvent(new MouseEvent('mouseup'))
      expect(navLog).toHaveLength(1)
      expect(navLog[0][0]).toEqual({ action: 'back' })
    })
  })

  describe('Info Cards', () => {
    it('does not show coordinate card without geolocation', () => {
      const wrapper = mountScreen()
      const cards = wrapper.findAll('.info-card')
      expect(cards.length).toBe(0)
    })
  })

  describe('Sensor Not Available', () => {
    it('shows not available message when no sensor', async () => {
      const wrapper = mountScreen()
      await nextTick()
      vi.advanceTimersByTime(1600)
      await nextTick()
      expect(wrapper.find('.not-available').exists()).toBe(true)
    })
  })
})
