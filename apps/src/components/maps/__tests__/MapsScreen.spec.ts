import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MapsScreen from '../MapsScreen.vue'
import { i18n, onNav, resetBus } from '@micronet/kernel'
import type { NavRequest } from '@micronet/kernel'

const mockAddControl = vi.fn()
const mockRemove = vi.fn()
const mockSetStyle = vi.fn()
const mockFlyTo = vi.fn()
const mockIsStyleLoaded = vi.fn().mockReturnValue(true)
const mockSetLngLat = vi.fn().mockReturnThis()
const mockAddTo = vi.fn().mockReturnThis()
const mockMarkerRemove = vi.fn()

vi.mock('maplibre-gl', () => {
  class Map {
    addControl = mockAddControl
    remove = mockRemove
    setStyle = mockSetStyle
    flyTo = mockFlyTo
    isStyleLoaded = mockIsStyleLoaded
    constructor() {}
  }
  class NavigationControl {}
  class Marker {
    setLngLat = mockSetLngLat
    addTo = mockAddTo
    remove = mockMarkerRemove
    constructor() {}
  }
  return {
    default: { Map, NavigationControl, Marker },
  }
})

describe('MapsScreen', () => {
  let navLog: NavRequest[][]
  let offNav: () => void
  let geoMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    resetBus()
    navLog = []
    offNav = onNav((msg) => { navLog.push([msg]) })

    // Mock geolocation to resolve immediately
    geoMock = vi.fn().mockImplementation((success: any) => {
      success({ coords: { latitude: 40.7128, longitude: -74.006 } })
    })
    Object.defineProperty(navigator, 'geolocation', {
      value: { getCurrentPosition: geoMock },
      configurable: true,
    })
  })

  afterEach(() => {
    offNav()
    resetBus()
    vi.useRealTimers()
  })

  it('renders maps screen container', async () => {
    const wrapper = mount(MapsScreen, { global: { plugins: [i18n] } })
    await nextTick()
    await nextTick()
    expect(wrapper.find('.maps-screen').exists()).toBe(true)
  })

  it('shows location loading state initially', async () => {
    // Override geolocation to not call success immediately
    geoMock.mockImplementation((_success: any, _error: any) => {
      // don't call success — simulate slow geolocation
    })

    const wrapper = mount(MapsScreen, { global: { plugins: [i18n] } })
    await nextTick()

    expect(wrapper.find('.location-loading').exists()).toBe(true)
    expect(wrapper.find('.loading-text').text()).toBe('Finding your location...')
  })

  it('renders back button', async () => {
    const wrapper = mount(MapsScreen, { global: { plugins: [i18n] } })
    await nextTick()
    await nextTick()
    await vi.advanceTimersByTimeAsync(200)

    const backBtn = wrapper.find('.back-btn')
    expect(backBtn.exists()).toBe(true)
  })

  it('back button navigates home', async () => {
    const wrapper = mount(MapsScreen, { global: { plugins: [i18n] } })
    await nextTick()
    await nextTick()
    await vi.advanceTimersByTimeAsync(200)

    const backBtn = wrapper.find('.back-btn')
    await backBtn.trigger('click')
    await nextTick()

    expect(navLog.length).toBeGreaterThanOrEqual(1)
    expect(navLog.some(msgs => msgs.some(m => m.action === 'back'))).toBe(true)
  })
})
