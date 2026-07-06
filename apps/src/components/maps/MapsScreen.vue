<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useNavigation } from '../../kernel'

const { t } = useI18n()
const { goBack } = useNavigation()

// ─── Map State ─────────────────────────────────────────────────
const mapContainer = ref<HTMLElement | null>(null)
let map: maplibregl.Map | null = null
let userMarker: maplibregl.Marker | null = null
const locationReady = ref(false)
const currentStyle = ref<'liberty' | 'bright' | 'positron' | 'dark'>('liberty')
const showStylePicker = ref(false)

// ─── OpenFreeMap Styles ────────────────────────────────────────
const STYLES: Record<string, string> = {
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
  bright: 'https://tiles.openfreemap.org/styles/bright',
  positron: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
}

// ─── Location ──────────────────────────────────────────────────
const userLocation = ref<[number, number] | null>(null)
const locationLoading = ref(true)
const locationError = ref('')

// ─── Style Toggle ──────────────────────────────────────────────
function setMapStyle(style: typeof currentStyle.value) {
  currentStyle.value = style
  showStylePicker.value = false
  if (map) {
    map.setStyle(STYLES[style])
  }
}

function getStyleName(style: string): string {
  const names: Record<string, string> = {
    liberty: 'Liberty',
    bright: 'Bright',
    positron: 'Positron',
    dark: 'Dark',
  }
  return names[style] || style
}

// ─── Map Initialization ────────────────────────────────────────
function initMap(center: [number, number]) {
  if (!mapContainer.value) return

  map = new maplibregl.Map({
    container: mapContainer.value,
    style: STYLES[currentStyle.value],
    center: [center[1], center[0]], // MapLibre uses [lng, lat]
    zoom: 15,
  })

  map.addControl(new maplibregl.NavigationControl(), 'bottom-right')
}

function addUserMarker(lngLat: [number, number]) {
  if (!map) return

  if (userMarker) {
    userMarker.remove()
  }

  const el = document.createElement('div')
  el.className = 'user-marker'
  el.innerHTML = `
    <div class="user-marker-inner">
      <div class="user-marker-dot"></div>
      <div class="user-marker-pulse"></div>
    </div>
  `

  userMarker = new maplibregl.Marker({ element: el })
    .setLngLat([lngLat[1], lngLat[0]])
    .addTo(map)
}

// ─── Location ──────────────────────────────────────────────────
function getCurrentLocation(): Promise<void> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      locationError.value = t('maps.geolocationNotSupported')
      locationLoading.value = false
      locationReady.value = true
      resolve()
      return
    }

    locationLoading.value = true
    locationError.value = ''

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        userLocation.value = loc
        locationLoading.value = false
        locationReady.value = true
        resolve()
      },
      (err) => {
        locationError.value = err.message
        locationLoading.value = false
        locationReady.value = true
        resolve()
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  })
}

function flyToUserLocation() {
  if (userLocation.value && map) {
    map.flyTo({ center: [userLocation.value[1], userLocation.value[0]], zoom: 15 })
  }
}

// ─── Lifecycle ─────────────────────────────────────────────────
onMounted(async () => {
  await getCurrentLocation()

  const center: [number, number] = userLocation.value || [40.7128, -74.006]
  initMap(center)

  if (userLocation.value) {
    const checkMap = setInterval(() => {
      if (map?.isStyleLoaded()) {
        clearInterval(checkMap)
        addUserMarker(userLocation.value!)
      }
    }, 100)
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<template>
  <div class="maps-screen">
    <!-- Location Loading State -->
    <div v-if="!locationReady" class="location-loading">
      <div class="loading-content">
        <div class="loading-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="loading-spinner"></div>
        <p class="loading-text">{{ t('maps.findingLocation') }}</p>
        <span class="loading-hint">{{ t('maps.locationHint') }}</span>
      </div>
    </div>

    <!-- Map Content -->
    <template v-else>
      <!-- Map Container -->
      <div ref="mapContainer" class="map-container"></div>

      <!-- Top Bar -->
      <div class="top-bar">
        <button class="back-btn" @click="goBack()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      </div>

      <!-- Map Controls -->
      <div class="map-controls">
        <!-- Style Picker -->
        <div class="style-picker-wrapper">
          <button
            class="control-btn"
            :class="{ active: showStylePicker }"
            @click="showStylePicker = !showStylePicker"
            aria-label="Map style"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </button>
          <Transition name="dropdown">
            <div v-if="showStylePicker" class="style-picker">
              <button
                v-for="(_, style) in STYLES"
                :key="style"
                class="style-option"
                :class="{ active: currentStyle === style }"
                @click="setMapStyle(style as typeof currentStyle)"
              >
                {{ getStyleName(style) }}
              </button>
            </div>
          </Transition>
        </div>

        <!-- Location Button -->
        <button
          class="control-btn location-btn"
          :class="{ loading: locationLoading, active: !!userLocation }"
          @click="getCurrentLocation().then(flyToUserLocation)"
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

      <!-- Attribution -->
      <div class="attribution">
        <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a>
        &middot;
        <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">&copy; OpenMapTiles</a>
        &middot;
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">Data from OpenStreetMap</a>
      </div>
    </template>

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

/* ─── Location Loading ───────────────────────────────────────── */
.location-loading {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, #f5f3ef 0%, #eae7e2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px;
  text-align: center;
}

.loading-icon {
  width: 64px;
  height: 64px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  animation: pulse 2s ease-in-out infinite;
}

.loading-icon svg {
  width: 32px;
  height: 32px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0, 0, 0, 0.08);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.loading-hint {
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* ─── Map ────────────────────────────────────────────────────── */
.map-container {
  position: absolute;
  inset: 0;
  z-index: 0;
}

/* ─── User Marker ────────────────────────────────────────────── */
:deep(.user-marker) {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.user-marker-inner) {
  position: relative;
  width: 24px;
  height: 24px;
}

:deep(.user-marker-dot) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  background: var(--color-accent);
  border: 3px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.4);
  z-index: 2;
}

:deep(.user-marker-pulse) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background: rgba(0, 122, 255, 0.15);
  border-radius: 50%;
  animation: markerPulse 2s ease-in-out infinite;
}

@keyframes markerPulse {
  0%, 100% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
  50% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
}

/* ─── Top Bar ────────────────────────────────────────────────── */
.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  padding: calc(env(safe-area-inset-top, 12px) + 8px) 16px 12px;
  pointer-events: none;
}

.top-bar > * {
  pointer-events: auto;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-bg);
  border: none;
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.back-btn:active {
  transform: scale(0.92);
  background: #f0f0f0;
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

/* ─── Map Controls ───────────────────────────────────────────── */
.map-controls {
  position: absolute;
  right: 16px;
  bottom: 100px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.style-picker-wrapper {
  position: relative;
}

.style-picker {
  position: absolute;
  right: 52px;
  top: 0;
  background: var(--color-bg);
  border-radius: 12px;
  padding: 4px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  min-width: 100px;
}

.style-option {
  display: block;
  width: 100%;
  padding: 10px 16px;
  font-size: 14px;
  color: var(--color-text);
  background: none;
  border: none;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.style-option:active {
  background: rgba(0, 0, 0, 0.04);
}

.style-option.active {
  color: var(--color-accent);
  font-weight: 500;
}

.control-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: white;
  border: none;
  color: var(--color-text);
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
  background: var(--color-accent);
  color: #fff;
}

.control-btn svg {
  width: 20px;
  height: 20px;
}

.location-btn.loading {
  opacity: 0.6;
}

.btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ─── Attribution ────────────────────────────────────────────── */
.attribution {
  position: absolute;
  bottom: 8px;
  left: 8px;
  z-index: 10;
  font-size: 10px;
  color: rgba(0, 0, 0, 0.5);
  background: rgba(255, 255, 255, 0.7);
  padding: 2px 6px;
  border-radius: 4px;
}

.attribution a {
  color: inherit;
  text-decoration: none;
}

.attribution a:hover {
  text-decoration: underline;
}

/* ─── Error Toast ────────────────────────────────────────────── */
.error-toast {
  position: absolute;
  top: calc(env(safe-area-inset-top, 12px) + 80px);
  left: 16px;
  right: 16px;
  z-index: 12;
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  color: var(--color-danger);
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
  .map-controls {
    right: 24px;
  }
}
</style>
