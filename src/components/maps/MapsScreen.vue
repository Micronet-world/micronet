<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { LMap, LTileLayer, LMarker, LPopup, LControlZoom, LPolyline } from '@vue-leaflet/vue-leaflet'
import { useSwipeGestures } from '../../composables/useSwipeGestures'

const emit = defineEmits<{
  'go-back': []
  'go-home': []
}>()

const { targetRef, isDragging } =
  useSwipeGestures({
    onSwipeRight: () => emit('go-back'),
    onSwipeUp: () => emit('go-home'),
  })

// ─── Map State ─────────────────────────────────────────────────
const mapRef = ref<InstanceType<typeof LMap> | null>(null)
const zoom = ref(13)
const center = ref<[number, number]>([40.7128, -74.006]) // NYC default
const mapReady = ref(false)
const currentLayer = ref<'street' | 'satellite'>('street')

// ─── Location ──────────────────────────────────────────────────
const userLocation = ref<[number, number] | null>(null)
const locationLoading = ref(false)
const locationError = ref('')

// ─── Search ────────────────────────────────────────────────────
const searchQuery = ref('')
const searchResults = ref<Place[]>([])
const searchLoading = ref(false)
const showSearchResults = ref(false)
const searchFocused = ref(false)

interface Place {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  type: string
}

// ─── Markers ───────────────────────────────────────────────────
const markers = ref<Place[]>([])
const selectedPlace = ref<Place | null>(null)

// ─── Directions ────────────────────────────────────────────────
const directionsMode = ref(false)
const directionsFrom = ref<Place | null>(null)
const directionsTo = ref<Place | null>(null)
const routePoints = ref<[number, number][]>([])
const routeDistance = ref('')
const routeDuration = ref('')
const showDirectionsPanel = ref(false)

// ─── Favorites ─────────────────────────────────────────────────
const favorites = ref<Place[]>([
  { id: 'fav1', name: 'Central Park', address: 'New York, NY', lat: 40.7829, lng: -73.9654, type: 'park' },
  { id: 'fav2', name: 'Times Square', address: 'Manhattan, NY', lat: 40.7580, lng: -73.9855, type: 'landmark' },
  { id: 'fav3', name: 'Brooklyn Bridge', address: 'New York, NY', lat: 40.7061, lng: -73.9969, type: 'landmark' },
])

// ─── UI State ──────────────────────────────────────────────────
const showBottomSheet = ref(false)
const bottomSheetContent = ref<'details' | 'favorites' | 'directions'>('details')
const activeTab = ref<'explore' | 'favorites' | 'directions'>('explore')

// ─── Tile Layers ───────────────────────────────────────────────
const streetTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const satelliteTileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

const currentTileUrl = computed(() =>
  currentLayer.value === 'satellite' ? satelliteTileUrl : streetTileUrl
)

const tileAttribution = computed(() =>
  currentLayer.value === 'satellite'
    ? '&copy; Esri'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
)

// ─── Map Ready ─────────────────────────────────────────────────
function onMapReady() {
  mapReady.value = true
}

// ─── Location ──────────────────────────────────────────────────
function getCurrentLocation() {
  if (!('geolocation' in navigator)) {
    locationError.value = 'Geolocation not supported'
    return
  }

  locationLoading.value = true
  locationError.value = ''

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]
      userLocation.value = loc
      center.value = loc
      zoom.value = 15
      locationLoading.value = false
    },
    (err) => {
      locationError.value = err.message
      locationLoading.value = false
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
  )
}

// ─── Search ────────────────────────────────────────────────────
const SEARCH_DEBOUNCE = 400
let searchTimeout: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    showSearchResults.value = false
    return
  }
  searchTimeout = setTimeout(performSearch, SEARCH_DEBOUNCE)
}

function onSearchBlur() {
  setTimeout(() => { searchFocused.value = false }, 200)
}

async function performSearch() {
  const q = searchQuery.value.trim()
  if (!q) return

  searchLoading.value = true
  showSearchResults.value = true

  try {
    const viewbox = getSearchViewbox()
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6&addressdetails=1${viewbox}`
    const resp = await fetch(url, {
      headers: { 'Accept-Language': 'en' },
    })
    const data = await resp.json()

    searchResults.value = data.map((item: any, i: number) => ({
      id: `search-${i}-${Date.now()}`,
      name: item.display_name.split(',')[0],
      address: item.display_name.split(',').slice(1, 3).join(',').trim(),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      type: item.type || 'place',
    }))
  } catch {
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

function getSearchViewbox(): string {
  const map = mapRef.value?.leafletObject
  if (!map) return ''
  const bounds = map.getBounds()
  return `&viewbox=${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()},${bounds.getSouth()}&bounded=0`
}

function selectSearchResult(place: Place) {
  selectedPlace.value = place
  center.value = [place.lat, place.lng]
  zoom.value = 16
  showSearchResults.value = false
  searchQuery.value = place.name
  searchFocused.value = false

  if (!markers.value.find(m => m.id === place.id)) {
    markers.value.push(place)
  }

  showBottomSheet.value = true
  bottomSheetContent.value = 'details'
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  showSearchResults.value = false
}

// ─── Directions ────────────────────────────────────────────────
function startDirections() {
  if (!selectedPlace.value) return
  directionsMode.value = true
  directionsTo.value = selectedPlace.value
  showDirectionsPanel.value = true
  bottomSheetContent.value = 'directions'

  if (userLocation.value) {
    directionsFrom.value = {
      id: 'user-location',
      name: 'My Location',
      address: '',
      lat: userLocation.value[0],
      lng: userLocation.value[1],
      type: 'location',
    }
    fetchRoute()
  }
}

async function fetchRoute() {
  if (!directionsFrom.value || !directionsTo.value) return

  try {
    const from = directionsFrom.value
    const to = directionsTo.value
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`
    const resp = await fetch(url)
    const data = await resp.json()

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      routePoints.value = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]])
      routeDistance.value = (route.distance / 1000).toFixed(1) + ' km'
      routeDuration.value = Math.round(route.duration / 60) + ' min'
    }
  } catch {
    routePoints.value = []
    routeDistance.value = ''
    routeDuration.value = ''
  }
}

function clearDirections() {
  directionsMode.value = false
  directionsFrom.value = null
  directionsTo.value = null
  routePoints.value = []
  routeDistance.value = ''
  routeDuration.value = ''
  showDirectionsPanel.value = false
}

// ─── Favorites ─────────────────────────────────────────────────
function toggleFavorite(place: Place) {
  const idx = favorites.value.findIndex(f => f.id === place.id)
  if (idx >= 0) {
    favorites.value.splice(idx, 1)
  } else {
    favorites.value.push({ ...place, id: `fav-${Date.now()}` })
  }
}

function isFavorite(place: Place): boolean {
  return favorites.value.some(f => f.lat === place.lat && f.lng === place.lng)
}

function selectFavorite(place: Place) {
  selectSearchResult(place)
  activeTab.value = 'explore'
}

// ─── Map Type ──────────────────────────────────────────────────
function toggleMapType() {
  currentLayer.value = currentLayer.value === 'street' ? 'satellite' : 'street'
}

// ─── Place Details ─────────────────────────────────────────────
function getPlaceIcon(type: string): string {
  const icons: Record<string, string> = {
    restaurant: '🍽️',
    cafe: '☕',
    bar: '🍺',
    hotel: '🏨',
    shop: '🛍️',
    park: '🌳',
    landmark: '🏛️',
    hospital: '🏥',
    school: '🎓',
    station: '🚉',
    airport: '✈️',
    location: '📍',
    place: '📍',
  }
  return icons[type] || '📍'
}

// ─── Bottom Sheet ──────────────────────────────────────────────
function closeBottomSheet() {
  showBottomSheet.value = false
  selectedPlace.value = null
}

// ─── Lifecycle ─────────────────────────────────────────────────
onMounted(() => {
  getCurrentLocation()
})
</script>

<template>
  <div
    :ref="targetRef"
    class="maps-screen"
    :class="{ dragging: isDragging }"
  >
    <!-- Map -->
    <div class="map-container">
      <LMap
        ref="mapRef"
        v-model:zoom="zoom"
        v-model:center="center"
        :use-global-leaflet="false"
        class="leaflet-map"
        @ready="onMapReady"
        :options="{ zoomControl: false, attributionControl: true }"
      >
        <LTileLayer
          :url="currentTileUrl"
          :attribution="tileAttribution"
          layer-type="base"
          name="Map"
        />

        <LControlZoom position="bottomright" />

        <!-- User location marker -->
        <LMarker
          v-if="userLocation"
          :lat-lng="userLocation"
        >
          <LPopup>
            <div class="popup-content">
              <strong>My Location</strong>
            </div>
          </LPopup>
        </LMarker>

        <!-- Search result markers -->
        <LMarker
          v-for="marker in markers"
          :key="marker.id"
          :lat-lng="[marker.lat, marker.lng]"
          @click="selectSearchResult(marker)"
        >
          <LPopup>
            <div class="popup-content">
              <strong>{{ marker.name }}</strong>
              <p v-if="marker.address">{{ marker.address }}</p>
            </div>
          </LPopup>
        </LMarker>

        <!-- Route polyline -->
        <LPolyline
          v-if="routePoints.length > 0"
          :lat-lngs="routePoints"
          color="#007aff"
          :weight="5"
          :opacity="0.8"
        />
      </LMap>
    </div>

    <!-- Top Overlay: Search Bar -->
    <div class="top-overlay">
      <div class="search-container" :class="{ focused: searchFocused, 'has-results': showSearchResults }">
        <div class="search-bar">
          <button class="back-btn" @click="emit('go-back')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <div class="search-input-wrapper">
            <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              type="text"
              class="search-input"
              placeholder="Search for a place"
              v-model="searchQuery"
              @input="onSearchInput"
              @focus="searchFocused = true; showSearchResults = true"
              @blur="onSearchBlur"
            />
            <button v-if="searchQuery" class="search-clear" @click="clearSearch">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.15)"/>
                <path d="M15.59 7L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z" fill="white"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Search Results Dropdown -->
        <Transition name="dropdown">
          <div v-if="showSearchResults && searchResults.length > 0" class="search-results">
            <button
              v-for="result in searchResults"
              :key="result.id"
              class="search-result-item"
              @mousedown.prevent="selectSearchResult(result)"
            >
              <span class="result-icon">{{ getPlaceIcon(result.type) }}</span>
              <div class="result-info">
                <span class="result-name">{{ result.name }}</span>
                <span class="result-address">{{ result.address }}</span>
              </div>
            </button>
          </div>
        </Transition>

        <div v-if="showSearchResults && searchLoading" class="search-loading">
          <div class="loading-spinner"></div>
          <span>Searching...</span>
        </div>
      </div>
    </div>

    <!-- Map Controls -->
    <div class="map-controls">
      <button
        class="control-btn"
        :class="{ active: currentLayer === 'satellite' }"
        @click="toggleMapType"
        aria-label="Toggle map type"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      </button>

      <button
        class="control-btn location-btn"
        :class="{ loading: locationLoading, active: !!userLocation }"
        @click="getCurrentLocation"
        aria-label="My location"
      >
        <svg v-if="!locationLoading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
          <circle cx="12" cy="12" r="3"/>
          <circle cx="12" cy="12" r="8" stroke-dasharray="4 2"/>
        </svg>
        <div v-else class="btn-spinner"></div>
      </button>
    </div>

    <!-- Tab Bar -->
    <div class="tab-bar">
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'explore' }"
        @click="activeTab = 'explore'"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <span>Explore</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'favorites' }"
        @click="activeTab = 'favorites'; showBottomSheet = true; bottomSheetContent = 'favorites'"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <span>Favorites</span>
      </button>
      <button
        class="tab-btn"
        :class="{ active: activeTab === 'directions' }"
        @click="activeTab = 'directions'; showBottomSheet = true; bottomSheetContent = 'directions'"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 11l19-9-9 19-2-8-8-2z"/>
        </svg>
        <span>Directions</span>
      </button>
    </div>

    <!-- Bottom Sheet -->
    <Transition name="sheet">
      <div v-if="showBottomSheet" class="bottom-sheet-overlay" @click.self="closeBottomSheet">
        <div class="bottom-sheet">
          <div class="sheet-handle" @click="closeBottomSheet">
            <div class="handle-bar"></div>
          </div>

          <!-- Place Details -->
          <div v-if="bottomSheetContent === 'details' && selectedPlace" class="sheet-content">
            <div class="place-header">
              <span class="place-icon">{{ getPlaceIcon(selectedPlace.type) }}</span>
              <div class="place-info">
                <h3>{{ selectedPlace.name }}</h3>
                <p v-if="selectedPlace.address">{{ selectedPlace.address }}</p>
              </div>
              <button
                class="fav-btn"
                :class="{ favorited: isFavorite(selectedPlace) }"
                @click="toggleFavorite(selectedPlace)"
              >
                <svg viewBox="0 0 24 24" :fill="isFavorite(selectedPlace) ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>
            <div class="place-actions">
              <button class="action-btn primary" @click="startDirections">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 11l19-9-9 19-2-8-8-2z"/>
                </svg>
                <span>Directions</span>
              </button>
              <button class="action-btn" @click="center = [selectedPlace.lat, selectedPlace.lng]; zoom = 17">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <span>Zoom In</span>
              </button>
            </div>
          </div>

          <!-- Favorites List -->
          <div v-else-if="bottomSheetContent === 'favorites'" class="sheet-content">
            <h3 class="sheet-title">Favorites</h3>
            <div v-if="favorites.length === 0" class="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <p>No favorites yet</p>
              <span>Search for places and tap the heart to save them</span>
            </div>
            <div v-else class="favorites-list">
              <button
                v-for="fav in favorites"
                :key="fav.id"
                class="favorite-item"
                @click="selectFavorite(fav)"
              >
                <span class="fav-icon">{{ getPlaceIcon(fav.type) }}</span>
                <div class="fav-info">
                  <span class="fav-name">{{ fav.name }}</span>
                  <span class="fav-address">{{ fav.address }}</span>
                </div>
                <svg class="fav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>

          <!-- Directions Panel -->
          <div v-else-if="bottomSheetContent === 'directions'" class="sheet-content">
            <h3 class="sheet-title">Directions</h3>
            <div class="directions-form">
              <div class="direction-inputs">
                <div class="direction-dot from"></div>
                <input
                  type="text"
                  class="direction-input"
                  :value="directionsFrom?.name || ''"
                  placeholder="My Location"
                  readonly
                />
                <button v-if="directionsFrom" class="direction-clear" @click="directionsFrom = null; routePoints = []">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
                </button>
              </div>
              <div class="direction-divider"></div>
              <div class="direction-inputs">
                <div class="direction-dot to"></div>
                <input
                  type="text"
                  class="direction-input"
                  :value="directionsTo?.name || ''"
                  placeholder="Choose destination"
                  readonly
                />
                <button v-if="directionsTo" class="direction-clear" @click="directionsTo = null; routePoints = []">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
                </button>
              </div>
            </div>

            <div v-if="routePoints.length > 0" class="route-info">
              <div class="route-stat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
                <span>{{ routeDuration }}</span>
              </div>
              <div class="route-stat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 11l19-9-9 19-2-8-8-2z"/>
                </svg>
                <span>{{ routeDistance }}</span>
              </div>
            </div>

            <div v-if="directionsMode && !directionsFrom" class="direction-hint">
              <p>Select a starting point by searching or using your current location</p>
              <button class="action-btn primary" @click="getCurrentLocation(); if (userLocation) directionsFrom = { id: 'user-location', name: 'My Location', address: '', lat: userLocation[0], lng: userLocation[1], type: 'location' }">
                Use My Location
              </button>
            </div>

            <button v-if="directionsMode" class="action-btn danger" @click="clearDirections">
              Clear Route
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Location Error Toast -->
    <Transition name="toast">
      <div v-if="locationError" class="error-toast">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M15 9l-6 6M9 9l6 6" stroke-linecap="round"/>
        </svg>
        <span>{{ locationError }}</span>
        <button @click="locationError = ''">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/></svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.maps-screen {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

/* ─── Map ────────────────────────────────────────────────────── */
.map-container {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.leaflet-map {
  width: 100%;
  height: 100%;
}

/* ─── Top Overlay ────────────────────────────────────────────── */
.top-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: calc(env(safe-area-inset-top, 12px) + 8px) 16px 12px;
  pointer-events: none;
}

.top-overlay > * {
  pointer-events: auto;
}

.search-container {
  position: relative;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: white;
  border-radius: 12px;
  padding: 8px 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s ease;
}

.search-container.focused .search-bar {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(0, 122, 255, 0.15);
}

.back-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  color: #007aff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease;
}

.back-btn:active {
  background: rgba(0, 0, 0, 0.1);
}

.back-btn svg {
  width: 18px;
  height: 18px;
}

.search-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-icon {
  width: 16px;
  height: 16px;
  color: #999;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 16px;
  color: #1a1a1a;
  background: none;
  font-family: inherit;
  padding: 4px 0;
}

.search-input::placeholder {
  color: #999;
}

.search-clear {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear svg {
  width: 20px;
  height: 20px;
}

/* ─── Search Results ─────────────────────────────────────────── */
.search-results {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  max-height: 320px;
  overflow-y: auto;
}

.search-result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.search-result-item:active {
  background: rgba(0, 0, 0, 0.04);
}

.search-result-item + .search-result-item {
  border-top: 0.5px solid rgba(0, 0, 0, 0.06);
}

.result-icon {
  font-size: 20px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-name {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-address {
  display: block;
  font-size: 13px;
  color: #6b6b6b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.search-loading {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #6b6b6b;
  font-size: 14px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #007aff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Map Controls ───────────────────────────────────────────── */
.map-controls {
  position: absolute;
  right: 16px;
  bottom: 140px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: white;
  border: none;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.control-btn:active {
  transform: scale(0.92);
  background: #f0f0f0;
}

.control-btn.active {
  background: #007aff;
  color: white;
}

.control-btn svg {
  width: 20px;
  height: 20px;
}

.location-btn.loading {
  opacity: 0.6;
}

/* ─── Tab Bar ────────────────────────────────────────────────── */
.tab-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: flex;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  padding: 8px 0 calc(env(safe-area-inset-bottom, 8px) + 8px);
}

.tab-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 0;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  transition: color 0.2s ease;
}

.tab-btn.active {
  color: #007aff;
}

.tab-btn svg {
  width: 22px;
  height: 22px;
}

.tab-btn span {
  font-size: 10px;
  font-weight: 500;
}

/* ─── Bottom Sheet ───────────────────────────────────────────── */
.bottom-sheet-overlay {
  position: absolute;
  inset: 0;
  z-index: 1001;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-end;
}

.bottom-sheet {
  width: 100%;
  max-height: 60vh;
  background: white;
  border-radius: 16px 16px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.sheet-handle {
  display: flex;
  justify-content: center;
  padding: 12px 0 8px;
  cursor: pointer;
}

.handle-bar {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.15);
}

.sheet-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 20px 24px;
}

.sheet-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16px;
}

/* ─── Place Details ──────────────────────────────────────────── */
.place-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.place-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  flex-shrink: 0;
}

.place-info {
  flex: 1;
  min-width: 0;
}

.place-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.place-info p {
  font-size: 14px;
  color: #6b6b6b;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fav-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.04);
  border: none;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.fav-btn:active {
  transform: scale(0.9);
}

.fav-btn.favorited {
  color: #ff3b30;
  background: rgba(255, 59, 48, 0.08);
}

.fav-btn svg {
  width: 20px;
  height: 20px;
}

.place-actions {
  display: flex;
  gap: 10px;
}

/* ─── Action Buttons ─────────────────────────────────────────── */
.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 12px;
  border: none;
  background: rgba(0, 0, 0, 0.04);
  color: #1a1a1a;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:active {
  transform: scale(0.97);
  background: rgba(0, 0, 0, 0.08);
}

.action-btn.primary {
  background: #007aff;
  color: white;
}

.action-btn.primary:active {
  background: #0066d6;
}

.action-btn.danger {
  background: rgba(255, 59, 48, 0.08);
  color: #ff3b30;
}

.action-btn.danger:active {
  background: rgba(255, 59, 48, 0.15);
}

.action-btn svg {
  width: 18px;
  height: 18px;
}

/* ─── Favorites ──────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  text-align: center;
}

.empty-state svg {
  width: 40px;
  height: 40px;
  color: #ccc;
}

.empty-state p {
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;
}

.empty-state span {
  font-size: 13px;
  color: #999;
}

.favorites-list {
  display: flex;
  flex-direction: column;
}

.favorite-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.favorite-item:active {
  opacity: 0.6;
}

.favorite-item + .favorite-item {
  border-top: 0.5px solid rgba(0, 0, 0, 0.06);
}

.fav-icon {
  font-size: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  flex-shrink: 0;
}

.fav-info {
  flex: 1;
  min-width: 0;
}

.fav-name {
  display: block;
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
}

.fav-address {
  display: block;
  font-size: 13px;
  color: #6b6b6b;
  margin-top: 2px;
}

.fav-chevron {
  width: 16px;
  height: 16px;
  color: #ccc;
  flex-shrink: 0;
}

/* ─── Directions ─────────────────────────────────────────────── */
.directions-form {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  padding: 4px 0;
  margin-bottom: 16px;
}

.direction-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
}

.direction-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.direction-dot.from {
  background: #007aff;
}

.direction-dot.to {
  background: #ff3b30;
}

.direction-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  color: #1a1a1a;
  background: none;
  font-family: inherit;
}

.direction-input::placeholder {
  color: #999;
}

.direction-clear {
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.direction-clear svg {
  width: 16px;
  height: 16px;
}

.direction-divider {
  height: 0.5px;
  background: rgba(0, 0, 0, 0.08);
  margin: 0 16px 0 38px;
}

.route-info {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: rgba(0, 122, 255, 0.06);
  border-radius: 12px;
}

.route-stat {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #007aff;
}

.route-stat svg {
  width: 18px;
  height: 18px;
}

.direction-hint {
  text-align: center;
  padding: 16px 0;
}

.direction-hint p {
  font-size: 14px;
  color: #6b6b6b;
  margin-bottom: 12px;
}

/* ─── Error Toast ────────────────────────────────────────────── */
.error-toast {
  position: absolute;
  top: calc(env(safe-area-inset-top, 12px) + 80px);
  left: 16px;
  right: 16px;
  z-index: 1002;
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  color: #ff3b30;
}

.error-toast svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.error-toast span {
  flex: 1;
}

.error-toast button {
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.error-toast button svg {
  width: 16px;
  height: 16px;
}

/* ─── Popup ──────────────────────────────────────────────────── */
.popup-content {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
}

.popup-content strong {
  display: block;
  font-size: 14px;
  color: #1a1a1a;
}

.popup-content p {
  font-size: 12px;
  color: #6b6b6b;
  margin-top: 2px;
}

/* ─── Transitions ────────────────────────────────────────────── */
.dropdown-enter-active {
  transition: all 0.2s ease-out;
}

.dropdown-leave-active {
  transition: all 0.15s ease-in;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.sheet-enter-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.sheet-leave-active {
  transition: all 0.2s ease-in;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}

.sheet-enter-from .bottom-sheet,
.sheet-leave-to .bottom-sheet {
  transform: translateY(100%);
}

.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast-leave-active {
  transition: all 0.2s ease-in;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* ─── Responsive ─────────────────────────────────────────────── */
@media (min-width: 768px) {
  .top-overlay {
    padding-left: 24px;
    padding-right: 24px;
  }

  .map-controls {
    right: 24px;
  }

  .bottom-sheet {
    max-width: 480px;
    margin: 0 auto;
    border-radius: 16px 16px 0 0;
  }
}
</style>
