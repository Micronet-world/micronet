<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSwipeGestures, storage } from 'micronet-kernel'
import { useNavigation } from '../../kernel'

const { t } = useI18n()
const { goBack, goHome } = useNavigation()

const { targetRef, isDragging } = useSwipeGestures({
  onSwipeUp: () => goHome(),
  onSwipeRight: () => goBack(),
})

// ─── Types ──────────────────────────────────────────────────────
interface GeoResult {
  id: number
  name: string
  latitude: number
  longitude: number
  country: string
  admin1?: string
}

interface CurrentWeather {
  temperature: number
  apparentTemperature: number
  humidity: number
  weatherCode: number
  windSpeed: number
  windDirection: number
  pressure: number
  isDay: boolean
}

interface DailyForecast {
  date: string
  weatherCode: number
  tempMax: number
  tempMin: number
  precipitation: number
  windSpeed: number
}

interface WeatherData {
  current: CurrentWeather
  daily: DailyForecast[]
  timezone: string
}

interface SavedLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  country: string
}

// ─── State ──────────────────────────────────────────────────────
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const searchResults = ref<GeoResult[]>([])
const isSearching = ref(false)
const showSearch = ref(false)
const weatherData = ref<WeatherData | null>(null)
const currentCity = ref('')
const currentCountry = ref('')
const savedLocations = ref<SavedLocation[]>([])
const showSavedLocations = ref(false)
const lastUpdated = ref('')

// ─── API ────────────────────────────────────────────────────────
const GEO_API = 'https://geocoding-api.open-meteo.com/v1/search'
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast'

async function searchCities(query: string): Promise<GeoResult[]> {
  if (!query.trim()) return []
  try {
    const res = await fetch(`${GEO_API}?name=${encodeURIComponent(query)}&count=6&language=en`)
    if (!res.ok) return []
    const data = await res.json()
    return data.results || []
  } catch {
    return []
  }
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,is_day',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max',
    timezone: 'auto',
    forecast_days: '7',
  })
  const res = await fetch(`${WEATHER_API}?${params}`)
  if (!res.ok) throw new Error('Failed to fetch weather')
  const data = await res.json()
  return {
    current: {
      temperature: data.current.temperature_2m,
      apparentTemperature: data.current.apparent_temperature,
      humidity: data.current.relative_humidity_2m,
      weatherCode: data.current.weather_code,
      windSpeed: data.current.wind_speed_10m,
      windDirection: data.current.wind_direction_10m,
      pressure: data.current.surface_pressure,
      isDay: data.current.is_day === 1,
    },
    daily: data.daily.time.map((date: string, i: number) => ({
      date,
      weatherCode: data.daily.weather_code[i],
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      precipitation: data.daily.precipitation_sum[i],
      windSpeed: data.daily.wind_speed_10m_max[i],
    })),
    timezone: data.timezone,
  }
}

// ─── Geolocation ────────────────────────────────────────────────
function getCurrentPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: 40.7128, lon: -74.006 })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: 40.7128, lon: -74.006 }),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    )
  })
}

async function reverseGeocode(lat: number, lon: number): Promise<{ name: string; country: string }> {
  try {
    const res = await fetch(`${GEO_API}?name=${lat.toFixed(1)}&count=1`)
    if (res.ok) {
      const data = await res.json()
      if (data.results?.length) {
        return { name: data.results[0].name, country: data.results[0].country || '' }
      }
    }
  } catch { /* ignore */ }
  return { name: `${lat.toFixed(2)}, ${lon.toFixed(2)}`, country: '' }
}

// ─── Core Actions ───────────────────────────────────────────────
async function loadWeatherForLocation(lat: number, lon: number, name: string, country: string) {
  loading.value = true
  error.value = ''
  try {
    weatherData.value = await fetchWeather(lat, lon)
    currentCity.value = name
    currentCountry.value = country
    lastUpdated.value = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    error.value = t('weather.networkError')
  } finally {
    loading.value = false
  }
}

async function loadCurrentLocation() {
  loading.value = true
  error.value = ''
  try {
    const pos = await getCurrentPosition()
    const geo = await reverseGeocode(pos.lat, pos.lon)
    await loadWeatherForLocation(pos.lat, pos.lon, geo.name, geo.country)
  } catch {
    error.value = t('weather.locationError')
    loading.value = false
  }
}

// ─── Search ─────────────────────────────────────────────────────
let searchDebounce: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchDebounce) clearTimeout(searchDebounce)
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    isSearching.value = false
    return
  }
  isSearching.value = true
  searchDebounce = setTimeout(async () => {
    searchResults.value = await searchCities(searchQuery.value)
    isSearching.value = false
  }, 350)
}

function selectCity(city: GeoResult) {
  showSearch.value = false
  searchQuery.value = ''
  searchResults.value = []
  loadWeatherForLocation(city.latitude, city.longitude, city.name, city.country || '')
}

// ─── Saved Locations ────────────────────────────────────────────
const STORAGE_KEY = 'micronet-weather-locations'

async function loadSavedLocations() {
  try {
    const raw = await storage.get(STORAGE_KEY)
    if (raw) savedLocations.value = JSON.parse(raw)
  } catch { /* ignore */ }
}

function saveLocations() {
  storage.set(STORAGE_KEY, JSON.stringify(savedLocations.value)).catch(() => {})
}

function addCurrentToSaved() {
  if (!currentCity.value) return
  if (savedLocations.value.find(l => l.name === currentCity.value)) return
  const loc: SavedLocation = {
    id: Date.now().toString(),
    name: currentCity.value,
    latitude: 0,
    longitude: 0,
    country: currentCountry.value,
  }
  savedLocations.value.push(loc)
  saveLocations()
}

function removeSavedLocation(id: string) {
  savedLocations.value = savedLocations.value.filter(l => l.id !== id)
  saveLocations()
}

function loadSavedLocation(loc: SavedLocation) {
  showSavedLocations.value = false
  loadWeatherForLocation(loc.latitude, loc.longitude, loc.name, loc.country)
}

// ─── WMO Weather Codes ─────────────────────────────────────────
function getWeatherDescription(code: number): string {
  const map: Record<number, string> = {
    0: t('weather.clearSky'),
    1: t('weather.mainlyClear'),
    2: t('weather.partlyCloudy'),
    3: t('weather.overcast'),
    45: t('weather.fog'),
    48: t('weather.fog'),
    51: t('weather.drizzle'),
    53: t('weather.drizzle'),
    55: t('weather.drizzle'),
    56: t('weather.freezingDrizzle'),
    57: t('weather.freezingDrizzle'),
    61: t('weather.rain'),
    63: t('weather.rain'),
    65: t('weather.rain'),
    66: t('weather.freezingRain'),
    67: t('weather.freezingRain'),
    71: t('weather.snow'),
    73: t('weather.snow'),
    75: t('weather.snow'),
    77: t('weather.snowGrains'),
    80: t('weather.showers'),
    81: t('weather.showers'),
    82: t('weather.heavyShowers'),
    85: t('weather.snowShowers'),
    86: t('weather.snowShowers'),
    95: t('weather.thunderstorm'),
    96: t('weather.thunderstormHail'),
    99: t('weather.thunderstormHail'),
  }
  return map[code] || t('weather.unknown')
}

function getWeatherEmoji(code: number, isDay: boolean = true): string {
  if (code === 0) return isDay ? '☀️' : '🌙'
  if (code === 1) return isDay ? '🌤' : '🌙'
  if (code === 2) return '⛅'
  if (code === 3) return '☁️'
  if (code === 45 || code === 48) return '🌫'
  if (code >= 51 && code <= 57) return '🌧'
  if (code >= 61 && code <= 67) return '🌧'
  if (code >= 71 && code <= 77) return '❄️'
  if (code >= 80 && code <= 82) return '🌦'
  if (code >= 85 && code <= 86) return '🌨'
  if (code >= 95) return '⛈'
  return '🌤'
}

// ─── Formatting ─────────────────────────────────────────────────
function tempRound(v: number): string {
  return Math.round(v) + '°'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return t('weather.today')
  return d.toLocaleDateString(undefined, { weekday: 'short' })
}

function windDirection(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

// ─── Lifecycle ──────────────────────────────────────────────────
onMounted(async () => {
  await loadSavedLocations()
  await loadCurrentLocation()
})

onUnmounted(() => {
  if (searchDebounce) clearTimeout(searchDebounce)
})
</script>

<template>
  <div :ref="targetRef" class="weather-screen" :class="{ dragging: isDragging }">
    <!-- Dynamic background based on weather -->
    <div class="wallpaper" :class="{
      'bg-clear': weatherData && weatherData.current.weatherCode === 0 && weatherData.current.isDay,
      'bg-night': weatherData && weatherData.current.weatherCode === 0 && !weatherData.current.isDay,
      'bg-cloudy': weatherData && weatherData.current.weatherCode > 2,
      'bg-rain': weatherData && weatherData.current.weatherCode >= 51 && weatherData.current.weatherCode <= 67,
    }"></div>

    <div class="content">
      <!-- Header -->
      <div class="header">
        <div class="header-top">
          <button class="header-btn icon-btn" @click="showSavedLocations = !showSavedLocations; showSearch = false">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6" stroke-linecap="round" />
              <line x1="3" y1="12" x2="21" y2="12" stroke-linecap="round" />
              <line x1="3" y1="18" x2="21" y2="18" stroke-linecap="round" />
            </svg>
          </button>
          <button class="city-btn" @click="showSearch = !showSearch; showSavedLocations = false">
            <span class="city-name">{{ currentCity || '...' }}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron">
              <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button class="header-btn icon-btn" @click="loadCurrentLocation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Search Panel -->
      <Transition name="slide-down">
        <div v-if="showSearch" class="search-panel">
          <div class="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" stroke-linecap="round" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              :placeholder="t('weather.searchCity')"
              autofocus
              @input="onSearchInput"
            />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''; searchResults = []">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" stroke-linecap="round" />
                <line x1="9" y1="9" x2="15" y2="15" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div v-if="isSearching" class="search-loading">
            <div class="spinner"></div>
          </div>
          <div v-else-if="searchResults.length > 0" class="search-results">
            <button
              v-for="city in searchResults"
              :key="city.id"
              class="search-result"
              @click="selectCity(city)"
            >
              <span class="result-name">{{ city.name }}</span>
              <span class="result-detail">{{ city.admin1 ? city.admin1 + ', ' : '' }}{{ city.country }}</span>
            </button>
          </div>
          <div v-else-if="searchQuery.trim() && !isSearching" class="search-empty">
            <span>{{ t('weather.noResults') }}</span>
          </div>
        </div>
      </Transition>

      <!-- Saved Locations Panel -->
      <Transition name="slide-down">
        <div v-if="showSavedLocations" class="saved-panel">
          <div class="saved-header">
            <span class="saved-title">{{ t('weather.savedLocations') }}</span>
            <button class="saved-add" @click="addCurrentToSaved">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round" />
                <line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div v-if="savedLocations.length === 0" class="saved-empty">
            <span>{{ t('weather.noLocations') }}</span>
          </div>
          <div v-else class="saved-list">
            <div v-for="loc in savedLocations" :key="loc.id" class="saved-item">
              <button class="saved-name" @click="loadSavedLocation(loc)">{{ loc.name }}</button>
              <button class="saved-remove" @click="removeSavedLocation(loc.id)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" stroke-linecap="round" />
                  <line x1="6" y1="6" x2="18" y2="18" stroke-linecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Loading State -->
      <div v-if="loading && !weatherData" class="loading-state">
        <div class="spinner large"></div>
        <span class="loading-text">{{ t('weather.loading') }}</span>
      </div>

      <!-- Error State -->
      <div v-else-if="error && !weatherData" class="error-state">
        <div class="error-icon">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="24" cy="24" r="20" />
            <path d="M24 14v12" stroke-linecap="round" />
            <circle cx="24" cy="32" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <span class="error-text">{{ error }}</span>
        <button class="retry-btn" @click="loadCurrentLocation">{{ t('common.back') }}</button>
      </div>

      <!-- Weather Content -->
      <div v-else-if="weatherData" class="weather-body" @click="showSearch = false; showSavedLocations = false">
        <!-- Current Weather -->
        <div class="current-section">
          <div class="current-icon">{{ getWeatherEmoji(weatherData.current.weatherCode, weatherData.current.isDay) }}</div>
          <div class="current-temp">{{ tempRound(weatherData.current.temperature) }}</div>
          <div class="current-desc">{{ getWeatherDescription(weatherData.current.weatherCode) }}</div>
          <div class="current-feels">{{ t('weather.feelsLike') }} {{ tempRound(weatherData.current.apparentTemperature) }}</div>
          <div class="current-range">
            <span class="range-high">{{ t('weather.high') }} {{ weatherData.daily[0] ? tempRound(weatherData.daily[0].tempMax) : '--' }}</span>
            <span class="range-sep">·</span>
            <span class="range-low">{{ t('weather.low') }} {{ weatherData.daily[0] ? tempRound(weatherData.daily[0].tempMin) : '--' }}</span>
          </div>
        </div>

        <!-- Detail Cards -->
        <div class="detail-cards">
          <div class="detail-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke-linecap="round" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            <span class="detail-label">{{ t('weather.humidity') }}</span>
            <span class="detail-value">{{ weatherData.current.humidity }}%</span>
          </div>
          <div class="detail-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M12.59 19.41A2 2 0 1 0 14 16H2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M17.73 7.73A2.5 2.5 0 1 1 19.5 12H2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="detail-label">{{ t('weather.wind') }}</span>
            <span class="detail-value">{{ Math.round(weatherData.current.windSpeed) }} {{ t('weather.km/h') }}</span>
            <span class="detail-sub">{{ windDirection(weatherData.current.windDirection) }}</span>
          </div>
          <div class="detail-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="detail-label">{{ t('weather.pressure') }}</span>
            <span class="detail-value">{{ Math.round(weatherData.current.pressure) }} {{ t('weather.hPa') }}</span>
          </div>
          <div class="detail-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" stroke-linecap="round" stroke-linejoin="round" />
              <line x1="8" y1="16" x2="8.01" y2="16" stroke-linecap="round" />
              <line x1="8" y1="20" x2="8.01" y2="20" stroke-linecap="round" />
              <line x1="12" y1="18" x2="12.01" y2="18" stroke-linecap="round" />
              <line x1="12" y1="22" x2="12.01" y2="22" stroke-linecap="round" />
              <line x1="16" y1="16" x2="16.01" y2="16" stroke-linecap="round" />
              <line x1="16" y1="20" x2="16.01" y2="20" stroke-linecap="round" />
            </svg>
            <span class="detail-label">{{ t('weather.precipitation') }}</span>
            <span class="detail-value">{{ weatherData.daily[0] ? weatherData.daily[0].precipitation.toFixed(1) : '0' }} {{ t('weather.mm') }}</span>
          </div>
        </div>

        <!-- 7-Day Forecast -->
        <div class="forecast-section">
          <div class="section-header">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" stroke-linecap="round" />
              <line x1="8" y1="2" x2="8" y2="6" stroke-linecap="round" />
              <line x1="3" y1="10" x2="21" y2="10" stroke-linecap="round" />
            </svg>
            <span>{{ t('weather.forecast') }}</span>
          </div>
          <div class="forecast-list">
            <div v-for="day in weatherData.daily" :key="day.date" class="forecast-row">
              <span class="forecast-day">{{ formatDate(day.date) }}</span>
              <span class="forecast-icon">{{ getWeatherEmoji(day.weatherCode, true) }}</span>
              <div class="forecast-bar-wrap">
                <span class="forecast-low">{{ tempRound(day.tempMin) }}</span>
                <div class="forecast-bar">
                  <div
                    class="forecast-bar-fill"
                    :style="{
                      left: `${Math.max(0, (day.tempMin + 10) / 50 * 100)}%`,
                      right: `${Math.max(0, 100 - (day.tempMax + 10) / 50 * 100)}%`,
                    }"
                  ></div>
                </div>
                <span class="forecast-high">{{ tempRound(day.tempMax) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Last Updated -->
        <div v-if="lastUpdated" class="last-updated">
          {{ lastUpdated }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weather-screen {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

.wallpaper {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #e8edf5 0%, #d4dbe8 50%, #c8d0e0 100%);
  transition: background 1s ease;
}

.wallpaper.bg-clear {
  background: linear-gradient(180deg, #87ceeb 0%, #b0d4f1 50%, #d4e8f7 100%);
}

.wallpaper.bg-night {
  background: linear-gradient(180deg, #1a2340 0%, #2a3558 50%, #3a4570 100%);
}

.wallpaper.bg-cloudy {
  background: linear-gradient(180deg, #c8cfd8 0%, #b8c2cf 50%, #a8b4c4 100%);
}

.wallpaper.bg-rain {
  background: linear-gradient(180deg, #8a9ab0 0%, #7a8ca0 50%, #6a7c90 100%);
}

.content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* ─── Header ─────────────────────────────────────────────────── */
.header {
  flex-shrink: 0;
  padding: calc(env(safe-area-inset-top, 12px) + 8px) 20px 8px;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-btn {
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.header-btn:active {
  opacity: 0.5;
}

.icon-btn {
  width: 36px;
  min-width: 36px;
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}

.city-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 20px;
  transition: background 0.15s ease;
}

.city-btn:active {
  background: rgba(0, 0, 0, 0.05);
}

.city-name {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
}

.chevron {
  width: 16px;
  height: 16px;
  color: var(--color-text-secondary);
}

/* ─── Search Panel ───────────────────────────────────────────── */
.search-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 0.5px solid var(--color-border);
  padding: 0 20px 12px;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 12px;
}

.search-icon {
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: none;
  font-size: 15px;
  font-family: inherit;
  color: var(--color-text);
  outline: none;
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-clear {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.search-clear svg {
  width: 16px;
  height: 16px;
}

.search-results {
  padding-top: 8px;
}

.search-result {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 12px 0;
  background: none;
  border: none;
  border-bottom: 0.5px solid var(--color-border);
  cursor: pointer;
  text-align: left;
  transition: opacity 0.15s ease;
}

.search-result:active {
  opacity: 0.6;
}

.search-result:last-child {
  border-bottom: none;
}

.result-name {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text);
}

.result-detail {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.search-empty, .search-loading {
  padding: 20px 0;
  text-align: center;
  font-size: 14px;
  color: var(--color-text-tertiary);
}

/* ─── Saved Locations ────────────────────────────────────────── */
.saved-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 0.5px solid var(--color-border);
  padding: 0 20px 12px;
}

.saved-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.saved-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.saved-add {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  border: none;
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.saved-add svg {
  width: 14px;
  height: 14px;
}

.saved-empty {
  padding: 16px 0;
  text-align: center;
  font-size: 14px;
  color: var(--color-text-tertiary);
}

.saved-list {
  display: flex;
  flex-direction: column;
}

.saved-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 0.5px solid var(--color-border);
}

.saved-item:last-child {
  border-bottom: none;
}

.saved-name {
  font-size: 16px;
  color: var(--color-text);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.saved-name:active {
  opacity: 0.6;
}

.saved-remove {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: none;
  border: none;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.saved-remove svg {
  width: 14px;
  height: 14px;
}

/* ─── Loading / Error ────────────────────────────────────────── */
.loading-state, .error-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.loading-text, .error-text {
  font-size: 16px;
  color: var(--color-text-secondary);
}

.error-icon {
  width: 56px;
  height: 56px;
  color: var(--color-text-muted);
}

.error-icon svg {
  width: 100%;
  height: 100%;
}

.retry-btn {
  padding: 10px 24px;
  border-radius: 20px;
  background: var(--color-accent);
  color: #fff;
  border: none;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.retry-btn:active {
  opacity: 0.8;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid var(--color-text-muted);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner.large {
  width: 36px;
  height: 36px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Weather Body ───────────────────────────────────────────── */
.weather-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 20px 24px;
}

/* ─── Current Weather ────────────────────────────────────────── */
.current-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0 28px;
}

.current-icon {
  font-size: 64px;
  line-height: 1;
  margin-bottom: 8px;
}

.current-temp {
  font-size: 80px;
  font-weight: 200;
  color: var(--color-text);
  letter-spacing: -4px;
  line-height: 1;
}

.current-desc {
  font-size: 18px;
  font-weight: 400;
  color: var(--color-text);
  margin-top: 4px;
}

.current-feels {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.current-range {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 15px;
  color: var(--color-text);
}

.range-sep {
  color: var(--color-text-muted);
}

/* ─── Detail Cards ───────────────────────────────────────────── */
.detail-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.detail-card {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-card svg {
  width: 18px;
  height: 18px;
  color: var(--color-text-tertiary);
}

.detail-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 22px;
  font-weight: 500;
  color: var(--color-text);
}

.detail-sub {
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* ─── Forecast ───────────────────────────────────────────────── */
.forecast-section {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 0.5px solid var(--color-border);
  margin-bottom: 4px;
}

.section-header svg {
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary);
}

.section-header span {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.forecast-list {
  display: flex;
  flex-direction: column;
}

.forecast-row {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 0.5px solid var(--color-border);
}

.forecast-row:last-child {
  border-bottom: none;
}

.forecast-day {
  font-size: 15px;
  font-weight: 400;
  color: var(--color-text);
  min-width: 48px;
}

.forecast-icon {
  font-size: 20px;
  margin: 0 12px;
  width: 28px;
  text-align: center;
}

.forecast-bar-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.forecast-low, .forecast-high {
  font-size: 14px;
  font-weight: 500;
  min-width: 32px;
}

.forecast-low {
  color: var(--color-text-secondary);
  text-align: right;
}

.forecast-high {
  color: var(--color-text);
}

.forecast-bar {
  flex: 1;
  height: 5px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.06);
  position: relative;
  overflow: hidden;
}

.forecast-bar-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--color-accent), #ff9500);
}

/* ─── Last Updated ───────────────────────────────────────────── */
.last-updated {
  text-align: center;
  padding: 12px 0;
  font-size: 12px;
  color: var(--color-text-muted);
}

/* ─── Transitions ────────────────────────────────────────────── */
.slide-down-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-down-leave-active {
  transition: all 0.2s ease-in;
}

.slide-down-enter-from, .slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ─── Responsive ─────────────────────────────────────────────── */
@media (min-width: 768px) {
  .current-temp {
    font-size: 96px;
  }

  .detail-cards {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
