import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import WeatherScreen from '../WeatherScreen.vue'
import { i18n, resetBus, onNav } from 'micronet-kernel'
import type { NavRequest } from 'micronet-kernel'

vi.mock('../../../composables/storage', () => ({
  storage: {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(undefined),
    del: vi.fn().mockResolvedValue(undefined),
  },
}))

const mockWeatherResponse = {
  current: {
    temperature_2m: 22.5,
    apparent_temperature: 20.1,
    relative_humidity_2m: 65,
    weather_code: 2,
    wind_speed_10m: 12.3,
    wind_direction_10m: 180,
    surface_pressure: 1013.2,
    is_day: 1,
  },
  daily: {
    time: ['2025-01-15', '2025-01-16', '2025-01-17', '2025-01-18', '2025-01-19', '2025-01-20', '2025-01-21'],
    weather_code: [2, 3, 61, 0, 1, 2, 80],
    temperature_2m_max: [25, 23, 18, 26, 24, 22, 20],
    temperature_2m_min: [15, 14, 10, 16, 15, 13, 11],
    precipitation_sum: [0, 0, 5.2, 0, 0, 0, 2.1],
    wind_speed_10m_max: [20, 15, 30, 10, 12, 18, 25],
  },
  timezone: 'America/New_York',
}

const mockGeoResponse = {
  results: [
    { id: 1, name: 'New York', latitude: 40.7128, longitude: -74.006, country: 'United States', admin1: 'New York' },
    { id: 2, name: 'London', latitude: 51.5074, longitude: -0.1278, country: 'United Kingdom', admin1: 'England' },
  ],
}

function mountScreen() {
  return mount(WeatherScreen, {
    global: { plugins: [i18n] },
  })
}

describe('WeatherScreen', () => {
  let navLog: NavRequest[][]
  let offNav: () => void
  let fetchSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2025, 0, 15, 12, 0))
    resetBus()
    navLog = []
    offNav = onNav((msg) => { navLog.push([msg]) })

    fetchSpy = vi.fn()
    global.fetch = fetchSpy

    fetchSpy.mockImplementation((url: string) => {
      if (url.includes('geocoding-api.open-meteo.com')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGeoResponse) })
      }
      if (url.includes('api.open-meteo.com')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockWeatherResponse) })
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) })
    })

    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: vi.fn((success: PositionCallback) => {
          success({ coords: { latitude: 40.7128, longitude: -74.006 } } as GeolocationPosition)
        }),
      },
    })
  })

  afterEach(() => {
    offNav()
    resetBus()
    vi.useRealTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  describe('Initial Load', () => {
    it('renders the weather screen', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      expect(wrapper.find('.weather-screen').exists()).toBe(true)
    })

    it('fetches weather on mount', async () => {
      mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      expect(fetchSpy).toHaveBeenCalled()
    })

    it('displays weather data after loading', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      expect(wrapper.find('.current-temp').exists()).toBe(true)
    })

    it('shows current temperature', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      expect(wrapper.find('.current-temp').text()).toBe('23°')
    })

    it('shows weather description', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      expect(wrapper.find('.current-desc').text()).toBeTruthy()
    })

    it('shows feels like temperature', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      expect(wrapper.find('.current-feels').text()).toContain('20°')
    })

    it('shows high and low temps', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      expect(wrapper.find('.current-range').text()).toContain('25°')
      expect(wrapper.find('.current-range').text()).toContain('15°')
    })
  })

  describe('Detail Cards', () => {
    it('shows humidity card', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      const cards = wrapper.findAll('.detail-card')
      expect(cards.length).toBe(4)
    })

    it('shows humidity value', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      expect(wrapper.text()).toContain('65%')
    })

    it('shows wind speed', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      expect(wrapper.text()).toContain('12')
    })

    it('shows pressure', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      expect(wrapper.text()).toContain('1013')
    })
  })

  describe('Forecast', () => {
    it('shows 7-day forecast section', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      expect(wrapper.find('.forecast-section').exists()).toBe(true)
    })

    it('shows 7 forecast rows', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      const rows = wrapper.findAll('.forecast-row')
      expect(rows.length).toBe(7)
    })

    it('shows forecast icons', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      const icons = wrapper.findAll('.forecast-icon')
      expect(icons.length).toBe(7)
    })

    it('shows forecast temperature bars', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      const bars = wrapper.findAll('.forecast-bar-fill')
      expect(bars.length).toBe(7)
    })
  })

  describe('Search', () => {
    it('opens search on search button click', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      await wrapper.find('.city-btn').trigger('click')
      await nextTick()
      expect(wrapper.find('.search-panel').exists()).toBe(true)
    })

    it('shows search input', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      await wrapper.find('.city-btn').trigger('click')
      await nextTick()
      expect(wrapper.find('.search-input').exists()).toBe(true)
    })

    it('shows search results after typing', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      await wrapper.find('.city-btn').trigger('click')
      await nextTick()
      await wrapper.find('.search-input').setValue('London')
      vi.advanceTimersByTime(500)
      await nextTick()
      await vi.advanceTimersByTimeAsync(500)
      await nextTick()
      const results = wrapper.findAll('.search-result')
      expect(results.length).toBeGreaterThan(0)
    })

    it('selects a city from search results', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      await wrapper.find('.city-btn').trigger('click')
      await nextTick()
      await wrapper.find('.search-input').setValue('London')
      vi.advanceTimersByTime(500)
      await nextTick()
      await vi.advanceTimersByTimeAsync(500)
      await nextTick()
      const results = wrapper.findAll('.search-result')
      if (results.length > 0) {
        await results[0].trigger('click')
        await vi.advanceTimersByTimeAsync(1000)
        await nextTick()
        expect(wrapper.find('.current-temp').exists()).toBe(true)
      }
    })
  })

  describe('Error Handling', () => {
    it('shows error when fetch fails', async () => {
      fetchSpy.mockImplementation(() => Promise.reject(new Error('Network error')))
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(2000)
      await nextTick()
      expect(wrapper.find('.error-state').exists()).toBe(true)
    })
  })

  describe('Navigation', () => {
    it('navigates home on swipe up', async () => {
      const wrapper = mountScreen()
      const screen = wrapper.find('.weather-screen')
      await screen.trigger('mousedown', { clientY: 300 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 100 }))
      window.dispatchEvent(new MouseEvent('mouseup'))
      expect(navLog).toHaveLength(1)
      expect(navLog[0][0]).toEqual({ action: 'home' })
    })

    it('navigates back on swipe right', async () => {
      const wrapper = mountScreen()
      const screen = wrapper.find('.weather-screen')
      await screen.trigger('mousedown', { clientX: 50 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 250 }))
      window.dispatchEvent(new MouseEvent('mouseup'))
      expect(navLog).toHaveLength(1)
      expect(navLog[0][0]).toEqual({ action: 'back' })
    })
  })

  describe('Saved Locations', () => {
    it('opens saved locations panel', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      const menuBtn = wrapper.findAll('.icon-btn')[0]
      await menuBtn.trigger('click')
      await nextTick()
      expect(wrapper.find('.saved-panel').exists()).toBe(true)
    })

    it('shows empty state for saved locations', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      const menuBtn = wrapper.findAll('.icon-btn')[0]
      await menuBtn.trigger('click')
      await nextTick()
      expect(wrapper.find('.saved-empty').exists()).toBe(true)
    })
  })

  describe('Last Updated', () => {
    it('shows last updated time', async () => {
      const wrapper = mountScreen()
      await vi.advanceTimersByTimeAsync(1000)
      await nextTick()
      expect(wrapper.find('.last-updated').exists()).toBe(true)
    })
  })
})
