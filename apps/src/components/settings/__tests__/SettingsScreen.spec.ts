import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SettingsScreen from '../SettingsScreen.vue'
import { i18n } from 'micronet-kernel'
import { onNav, resetBus, type NavRequest } from 'micronet-kernel'

describe('SettingsScreen', () => {
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

  it('renders Settings title on main page', async () => {
    const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
    await nextTick()
    expect(wrapper.find('h1').text()).toBe('Settings')
  })

  it('renders search input on main page', async () => {
    const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
    await nextTick()
    const searchInput = wrapper.find('.search-input')
    expect(searchInput.exists()).toBe(true)
    expect(searchInput.attributes('placeholder')).toBe('Search')
  })

  it('renders all main settings rows', async () => {
    const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
    await nextTick()
    const labels = wrapper.findAll('.row-label').map(l => l.text())
    expect(labels).toContain('Airplane Mode')
    expect(labels).toContain('Wi-Fi')
    expect(labels).toContain('Bluetooth')
    expect(labels).toContain('Display & Brightness')
    expect(labels).toContain('Notifications')
    expect(labels).toContain('Privacy & Security')
    expect(labels).toContain('About')
  })

  it('back button does not appear on main page', () => {
    const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
    expect(wrapper.find('.back-btn').exists()).toBe(false)
  })

  describe('search functionality', () => {
    it('filters results when typing in search', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()

      const input = wrapper.find('.search-input')
      await input.setValue('wifi')
      await nextTick()

      const results = wrapper.findAll('.search-results .row-label')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].text()).toBe('Wi-Fi')
    })

    it('shows no results for invalid search', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()

      const input = wrapper.find('.search-input')
      await input.setValue('xyznonexistent')
      await nextTick()

      expect(wrapper.find('.no-results').exists()).toBe(true)
      expect(wrapper.find('.no-results').text()).toBe('No Results')
    })

    it('hides normal settings list during search', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()

      const input = wrapper.find('.search-input')
      await input.setValue('bluetooth')
      await nextTick()

      // Normal groups should be hidden
      expect(wrapper.find('.stagger-1').exists()).toBe(false)
    })

    it('clicking search result navigates to the page', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()

      const input = wrapper.find('.search-input')
      await input.setValue('wifi')
      await nextTick()

      const result = wrapper.find('.search-results .settings-row')
      await result.trigger('click')
      await nextTick()

      expect(wrapper.find('h1').text()).toBe('Wi-Fi')
    })

    it('clear button resets search query', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()

      const input = wrapper.find('.search-input')
      await input.setValue('wifi')
      await nextTick()

      const clearBtn = wrapper.find('.search-clear')
      expect(clearBtn.exists()).toBe(true)
      await clearBtn.trigger('click')
      await nextTick()

      expect((input.element as HTMLInputElement).value).toBe('')
    })
  })

  describe('navigation', () => {
    it('navigates to Wi-Fi page', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const wifiRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Wi-Fi') && !r.text().includes('Airplane'))
      await wifiRow!.trigger('click')
      await nextTick()
      expect(wrapper.find('h1').text()).toBe('Wi-Fi')
    })

    it('navigates to Bluetooth page', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const btRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Bluetooth'))
      await btRow!.trigger('click')
      await nextTick()
      expect(wrapper.find('h1').text()).toBe('Bluetooth')
    })

    it('navigates to Display & Brightness page', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const displayRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Display'))
      await displayRow!.trigger('click')
      await nextTick()
      expect(wrapper.find('h1').text()).toBe('Display & Brightness')
    })

    it('navigates to Notifications page', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const notifRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Notifications'))
      await notifRow!.trigger('click')
      await nextTick()
      expect(wrapper.find('h1').text()).toBe('Notifications')
    })

    it('navigates to Privacy & Security page', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const privacyRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Privacy'))
      await privacyRow!.trigger('click')
      await nextTick()
      expect(wrapper.find('h1').text()).toBe('Privacy & Security')
    })

    it('navigates to About page', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const aboutRow = wrapper.findAll('.settings-row').find(r => r.text() === 'About')
      await aboutRow!.trigger('click')
      await nextTick()
      expect(wrapper.find('h1').text()).toBe('About')
    })
  })

  describe('Wi-Fi page', () => {
    it('shows Wi-Fi toggle', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const wifiRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Wi-Fi') && !r.text().includes('Airplane'))
      await wifiRow!.trigger('click')
      await nextTick()

      const toggles = wrapper.findAll('.toggle')
      expect(toggles.length).toBeGreaterThan(0)
    })

    it('shows network list when Wi-Fi enabled', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const wifiRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Wi-Fi') && !r.text().includes('Airplane'))
      await wifiRow!.trigger('click')
      await nextTick()

      const labels = wrapper.findAll('.row-label').map(l => l.text())
      expect(labels).toContain('Home Network')
      expect(labels).toContain('Office_5G')
      expect(labels).toContain('Coffee Shop')
    })

    it('shows "Choose a Network" header', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const wifiRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Wi-Fi') && !r.text().includes('Airplane'))
      await wifiRow!.trigger('click')
      await nextTick()

      const headers = wrapper.findAll('.group-header').map(h => h.text())
      expect(headers).toContain('Choose a Network')
    })
  })

  describe('Bluetooth page', () => {
    it('shows Bluetooth toggle', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const btRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Bluetooth'))
      await btRow!.trigger('click')
      await nextTick()

      const toggles = wrapper.findAll('.toggle')
      expect(toggles.length).toBeGreaterThan(0)
    })

    it('shows scan button when Bluetooth enabled', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const btRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Bluetooth'))
      await btRow!.trigger('click')
      await nextTick()

      const labels = wrapper.findAll('.row-label').map(l => l.text())
      expect(labels).toContain('Scan for Devices')
    })

    it('shows empty state when no devices paired', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const btRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Bluetooth'))
      await btRow!.trigger('click')
      await nextTick()

      expect(wrapper.find('.bt-empty').exists()).toBe(true)
      expect(wrapper.find('.bt-empty p').text()).toBe('No Devices')
    })
  })

  describe('Display & Brightness page', () => {
    it('shows Dark Mode toggle', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const displayRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Display'))
      await displayRow!.trigger('click')
      await nextTick()

      const labels = wrapper.findAll('.row-label').map(l => l.text())
      expect(labels).toContain('Dark Mode')
      expect(labels).toContain('True Tone')
      expect(labels).toContain('Auto-Brightness')
    })

    it('shows brightness slider', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const displayRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Display'))
      await displayRow!.trigger('click')
      await nextTick()

      expect(wrapper.find('.slider').exists()).toBe(true)
      expect(wrapper.find('.slider-fill').exists()).toBe(true)
    })

    it('shows font size picker', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const displayRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Display'))
      await displayRow!.trigger('click')
      await nextTick()

      expect(wrapper.find('.font-size-picker').exists()).toBe(true)
      const buttons = wrapper.findAll('.font-size-btn')
      expect(buttons).toHaveLength(3)
    })
  })

  describe('Notifications page', () => {
    it('shows Allow Notifications toggle', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const notifRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Notifications'))
      await notifRow!.trigger('click')
      await nextTick()

      const labels = wrapper.findAll('.row-label').map(l => l.text())
      expect(labels).toContain('Allow Notifications')
    })

    it('shows app notification list when enabled', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const notifRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Notifications'))
      await notifRow!.trigger('click')
      await nextTick()

      const labels = wrapper.findAll('.row-label').map(l => l.text())
      expect(labels).toContain('Messages')
      expect(labels).toContain('Mail')
      expect(labels).toContain('Calendar')
      expect(labels).toContain('Photos')
    })
  })

  describe('Privacy & Security page', () => {
    it('shows Location Services toggle', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const privacyRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Privacy'))
      await privacyRow!.trigger('click')
      await nextTick()

      const labels = wrapper.findAll('.row-label').map(l => l.text())
      expect(labels).toContain('Location Services')
    })

    it('shows security rows', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const privacyRow = wrapper.findAll('.settings-row').find(r => r.text().includes('Privacy'))
      await privacyRow!.trigger('click')
      await nextTick()

      const labels = wrapper.findAll('.row-label').map(l => l.text())
      expect(labels).toContain('Face ID')
      expect(labels).toContain('Passcode')
    })
  })

  describe('About page', () => {
    it('shows device info', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const aboutRow = wrapper.findAll('.settings-row').find(r => r.text() === 'About')
      await aboutRow!.trigger('click')
      await nextTick()

      const labels = wrapper.findAll('.row-label').map(l => l.text())
      expect(labels).toContain('Name')
      expect(labels).toContain('Model')
      expect(labels).toContain('OS')
      expect(labels).toContain('Version')
    })

    it('shows storage bar', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const aboutRow = wrapper.findAll('.settings-row').find(r => r.text() === 'About')
      await aboutRow!.trigger('click')
      await nextTick()

      expect(wrapper.find('.storage-bar').exists()).toBe(true)
      expect(wrapper.find('.storage-used').exists()).toBe(true)
    })

    it('displays correct device values', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      await nextTick()
      const aboutRow = wrapper.findAll('.settings-row').find(r => r.text() === 'About')
      await aboutRow!.trigger('click')
      await nextTick()

      const values = wrapper.findAll('.row-value').map(v => v.text())
      expect(values).toContain('iPhone')
      expect(values).toContain('Mobile Prototype')
      expect(values).toContain('iOS 18.0')
      expect(values).toContain('1.0.0')
    })
  })

  describe('swipe gestures', () => {
    it('locks on downward swipe > 80px', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      const screen = wrapper.find('.settings-screen')

      await screen.trigger('mousedown', { clientY: 200 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 300 }))
      window.dispatchEvent(new MouseEvent('mouseup'))

      expect(navLog).toHaveLength(1)
      expect(navLog[0][0]).toEqual({ action: 'lock' })
    })

    it('navigates home on upward swipe > 80px', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      const screen = wrapper.find('.settings-screen')

      await screen.trigger('mousedown', { clientY: 300 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 200 }))
      window.dispatchEvent(new MouseEvent('mouseup'))

      expect(navLog).toHaveLength(1)
      expect(navLog[0][0]).toEqual({ action: 'home' })
    })

    it('does NOT navigate on short swipe', async () => {
      const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
      const screen = wrapper.find('.settings-screen')

      await screen.trigger('mousedown', { clientY: 300 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 260 }))
      window.dispatchEvent(new MouseEvent('mouseup'))

      expect(navLog).toHaveLength(0)
    })
  })

  it('cleans up global mouse listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(SettingsScreen, { global: { plugins: [i18n] } })
    wrapper.unmount()

    const calls = removeSpy.mock.calls.map(c => c[0])
    expect(calls).toContain('mousemove')
    expect(calls).toContain('mouseup')
  })
})
