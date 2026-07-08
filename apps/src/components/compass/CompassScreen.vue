<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSwipeGestures } from '@micronet/sdk'
import { useNavigation } from '@micronet/sdk'

const { t } = useI18n()
const { goBack, goHome } = useNavigation()

const { targetRef, isDragging } = useSwipeGestures({
  onSwipeRight: () => goBack(),
})

const { targetRef: barTargetRef } = useSwipeGestures({
  onSwipeUp: () => goHome(),
  threshold: 40,
})

// ─── Compass State ─────────────────────────────────────────────
const heading = ref(0)
const smoothHeading = ref(0)
const headingLocked = ref(false)
const lockedHeading = ref(0)
const hasPermission = ref(false)
const isCalibrating = ref(true)
const sensorAvailable = ref(false)
const altitude = ref<number | null>(null)
const latitude = ref<number | null>(null)
const longitude = ref<number | null>(null)
const accuracy = ref<number | null>(null)

let smoothingTimer: ReturnType<typeof setInterval> | null = null
let sensorTimeout: ReturnType<typeof setTimeout> | null = null

// ─── Cardinal Direction ────────────────────────────────────────
const cardinalDirection = computed(() => {
  const h = headingLocked.value ? lockedHeading.value : smoothHeading.value
  const dirs = [
    { key: 'north', min: 337.5, max: 360 },
    { key: 'north', min: 0, max: 22.5 },
    { key: 'northEast', min: 22.5, max: 67.5 },
    { key: 'east', min: 67.5, max: 112.5 },
    { key: 'southEast', min: 112.5, max: 157.5 },
    { key: 'south', min: 157.5, max: 202.5 },
    { key: 'southWest', min: 202.5, max: 247.5 },
    { key: 'west', min: 247.5, max: 292.5 },
    { key: 'northWest', min: 292.5, max: 337.5 },
  ]
  const dir = dirs.find(d => h >= d.min && h < d.max)
  return dir ? t(`compass.${dir.key}`) : t('compass.north')
})

const displayHeading = computed(() => {
  const h = headingLocked.value ? lockedHeading.value : smoothHeading.value
  return Math.round(h)
})

// ─── Compass Ticks ─────────────────────────────────────────────
interface Tick {
  x1: number
  y1: number
  x2: number
  y2: number
  major: boolean
  label: number | null
  cx: number
  cy: number
}

const compassTicks = computed<Tick[]>(() => {
  const ticks: Tick[] = []
  const cx = 150
  const cy = 150
  const outerR = 138
  const innerRMinor = 130
  const innerRMajor = 124
  const labelR = 112

  for (let deg = 0; deg < 360; deg += 5) {
    const rad = (deg - 90) * Math.PI / 180
    const isMajor = deg % 30 === 0
    const innerR = isMajor ? innerRMajor : innerRMinor
    const x1 = cx + outerR * Math.cos(rad)
    const y1 = cy + outerR * Math.sin(rad)
    const x2 = cx + innerR * Math.cos(rad)
    const y2 = cy + innerR * Math.sin(rad)
    const lx = cx + labelR * Math.cos(rad)
    const ly = cy + labelR * Math.sin(rad)

    ticks.push({
      x1, y1, x2, y2,
      major: isMajor,
      label: isMajor && deg % 90 !== 0 ? deg : null,
      cx: lx,
      cy: ly,
    })
  }
  return ticks
})

// ─── Cardinal Labels ───────────────────────────────────────────
interface CardinalLabel {
  letter: string
  x: number
  y: number
  isNorth: boolean
}

const cardinalLabels = computed<CardinalLabel[]>(() => {
  const cx = 150
  const cy = 150
  const r = 98
  const positions = [
    { letter: 'N', deg: 0 },
    { letter: 'E', deg: 90 },
    { letter: 'S', deg: 180 },
    { letter: 'W', deg: 270 },
  ]
  return positions.map(p => {
    const rad = (p.deg - 90) * Math.PI / 180
    return {
      letter: p.letter,
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
      isNorth: p.letter === 'N',
    }
  })
})

// ─── Intercardinal Labels ──────────────────────────────────────
interface IntercardinalLabel {
  letter: string
  x: number
  y: number
}

const intercardinalLabels = computed<IntercardinalLabel[]>(() => {
  const cx = 150
  const cy = 150
  const r = 98
  const positions = [
    { letter: 'NE', deg: 45 },
    { letter: 'SE', deg: 135 },
    { letter: 'SW', deg: 225 },
    { letter: 'NW', deg: 315 },
  ]
  return positions.map(p => {
    const rad = (p.deg - 90) * Math.PI / 180
    return {
      letter: p.letter,
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    }
  })
})

// ─── Device Orientation ────────────────────────────────────────
function handleOrientation(e: DeviceOrientationEvent) {
  sensorAvailable.value = true
  isCalibrating.value = false

  let h: number
  if ('webkitCompassHeading' in e && (e as any).webkitCompassHeading !== undefined) {
    h = (e as any).webkitCompassHeading
  } else if (e.alpha !== null) {
    h = (360 - e.alpha) % 360
  } else {
    return
  }

  if (e.absolute === false && !('webkitCompassHeading' in e)) {
    isCalibrating.value = true
  }

  heading.value = h
  if (!headingLocked.value) {
    smoothHeading.value = h
  }
}

function smoothHeadingUpdate() {
  if (headingLocked.value) return
  const target = heading.value
  const current = smoothHeading.value
  let diff = target - current
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360
  smoothHeading.value = (current + diff * 0.15 + 360) % 360
}

async function requestOrientationPermission() {
  if (typeof DeviceOrientationEvent !== 'undefined') {
    if ('requestPermission' in DeviceOrientationEvent) {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission()
        if (permission === 'granted') {
          hasPermission.value = true
          startListening()
        } else {
          sensorAvailable.value = false
          isCalibrating.value = false
        }
      } catch {
        sensorAvailable.value = false
        isCalibrating.value = false
      }
    } else {
      hasPermission.value = true
      startListening()
    }
  } else {
    sensorAvailable.value = false
    isCalibrating.value = false
  }
}

function startListening() {
  window.addEventListener('deviceorientation', handleOrientation, true)
  smoothingTimer = setInterval(smoothHeadingUpdate, 16)
  sensorTimeout = setTimeout(() => {
    if (!sensorAvailable.value) {
      isCalibrating.value = false
    }
  }, 1500)
}

function stopListening() {
  window.removeEventListener('deviceorientation', handleOrientation, true)
  if (smoothingTimer) {
    clearInterval(smoothingTimer)
    smoothingTimer = null
  }
  if (sensorTimeout) {
    clearTimeout(sensorTimeout)
    sensorTimeout = null
  }
}

// ─── Geolocation ───────────────────────────────────────────────
function updatePosition() {
  if (!navigator.geolocation) return
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      latitude.value = pos.coords.latitude
      longitude.value = pos.coords.longitude
      altitude.value = pos.coords.altitude
      accuracy.value = pos.coords.accuracy
    },
    () => {},
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  )
}

// ─── Lock Heading ──────────────────────────────────────────────
function toggleLock() {
  if (headingLocked.value) {
    headingLocked.value = false
  } else {
    lockedHeading.value = smoothHeading.value
    headingLocked.value = true
  }
}

// ─── Format Coordinates ────────────────────────────────────────
function formatCoord(val: number, isLat: boolean): string {
  const dir = isLat ? (val >= 0 ? 'N' : 'S') : (val >= 0 ? 'E' : 'W')
  return `${Math.abs(val).toFixed(4)}° ${dir}`
}

// ─── Lifecycle ─────────────────────────────────────────────────
onMounted(() => {
  requestOrientationPermission()
  updatePosition()
})

onUnmounted(() => {
  stopListening()
})
</script>

<template>
  <div :ref="targetRef" class="compass-screen" :class="{ dragging: isDragging }">
    <div class="wallpaper"></div>
    <div class="content">
      <!-- Header -->
      <div class="header">
        <h1 class="header-title">{{ t('compass.title') }}</h1>
      </div>

      <div class="compass-body">
        <!-- Heading Display -->
        <div class="heading-display">
          <div class="heading-degrees-row">
            <span class="heading-degrees">{{ displayHeading }}</span>
            <span class="heading-symbol">°</span>
          </div>
          <span class="heading-direction" :class="{ locked: headingLocked }">
            {{ cardinalDirection }}
          </span>
        </div>

        <!-- Compass -->
        <div class="compass-container">
          <!-- Fixed heading indicator -->
          <div class="heading-indicator">
            <svg viewBox="0 0 20 16" fill="none">
              <path d="M10 0L20 16H0L10 0z" fill="currentColor" />
            </svg>
          </div>

          <svg class="compass-svg" viewBox="0 0 300 300">
            <!-- Outer ring -->
            <circle cx="150" cy="150" r="142" class="ring-outer" />
            <circle cx="150" cy="150" r="138" class="ring-inner" />

            <!-- Rotating compass face -->
            <g :transform="`rotate(${- (headingLocked ? lockedHeading : smoothHeading)}, 150, 150)`">
              <!-- Tick marks -->
              <line
                v-for="(tick, i) in compassTicks"
                :key="'t' + i"
                :x1="tick.x1"
                :y1="tick.y1"
                :x2="tick.x2"
                :y2="tick.y2"
                :class="tick.major ? 'tick-major' : 'tick-minor'"
              />

              <!-- Degree labels (30° marks) -->
              <text
                v-for="(tick, i) in compassTicks.filter(t => t.label !== null)"
                :key="'l' + i"
                :x="tick.cx"
                :y="tick.cy"
                class="tick-label"
                text-anchor="middle"
                dominant-baseline="central"
              >{{ tick.label }}</text>

              <!-- Intercardinal labels -->
              <text
                v-for="(label, i) in intercardinalLabels"
                :key="'ic' + i"
                :x="label.x"
                :y="label.y"
                class="intercardinal-label"
                text-anchor="middle"
                dominant-baseline="central"
              >{{ label.letter }}</text>

              <!-- Cardinal labels -->
              <text
                v-for="(label, i) in cardinalLabels"
                :key="'c' + i"
                :x="label.x"
                :y="label.y"
                :class="['cardinal-label', { 'cardinal-north': label.isNorth }]"
                text-anchor="middle"
                dominant-baseline="central"
              >{{ label.letter }}</text>

              <!-- Compass needle -->
              <polygon
                points="150,45 158,150 150,160 142,150"
                class="needle-north"
              />
              <polygon
                points="150,255 158,150 150,140 142,150"
                class="needle-south"
              />

              <!-- Center circle -->
              <circle cx="150" cy="150" r="6" class="center-dot" />
            </g>

            <!-- Fixed crosshairs (always upright) -->
            <line x1="150" y1="140" x2="150" y2="160" class="crosshair" />
            <line x1="140" y1="150" x2="160" y2="150" class="crosshair" />
          </svg>
        </div>

        <!-- Lock button -->
        <button class="lock-btn" :class="{ active: headingLocked }" @click="toggleLock">
          <svg v-if="!headingLocked" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </svg>
          <span>{{ headingLocked ? t('compass.unlockHeading') : t('compass.lockHeading') }}</span>
        </button>

        <!-- Info Cards -->
        <div class="info-cards">
          <div v-if="latitude !== null && longitude !== null" class="info-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span class="info-label">{{ t('compass.coordinates') }}</span>
            <span class="info-value">{{ formatCoord(latitude, true) }}</span>
            <span class="info-value">{{ formatCoord(longitude, false) }}</span>
          </div>

          <div v-if="altitude !== null" class="info-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2L2 22h20L12 2z" stroke-linecap="round" stroke-linejoin="round" />
              <line x1="12" y1="10" x2="12" y2="16" stroke-linecap="round" />
            </svg>
            <span class="info-label">{{ t('compass.altitude') }}</span>
            <span class="info-value">{{ Math.round(altitude) }} m</span>
          </div>

          <div v-if="accuracy !== null" class="info-card">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            <span class="info-label">{{ t('compass.accuracy') }}</span>
            <span class="info-value">±{{ Math.round(accuracy) }} m</span>
          </div>
        </div>

        <!-- Not Available State -->
        <div v-if="!isCalibrating && !sensorAvailable" class="not-available">
          <div class="not-available-icon">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="24" cy="24" r="20" />
              <path d="M24 8v32M8 24h32" stroke-linecap="round" />
              <path d="M14 14l20 20M34 14L14 34" stroke-linecap="round" opacity="0.3" />
            </svg>
          </div>
          <span class="not-available-text">{{ t('compass.notAvailable') }}</span>
          <span class="not-available-desc">{{ t('compass.notAvailableDesc') }}</span>
        </div>

        <!-- Calibrating State -->
        <div v-if="isCalibrating && sensorAvailable" class="calibrating">
          <div class="spinner"></div>
          <span>{{ t('compass.calibrating') }}</span>
        </div>
      </div>

      <!-- Home Bar -->
      <div class="home-bar-area" :ref="barTargetRef">
        <div class="home-bar"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.compass-screen {
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
  background: linear-gradient(180deg, var(--color-bg-warm-from) 0%, var(--color-bg-warm-to) 100%);
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
  text-align: center;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-accent);
  letter-spacing: -0.2px;
}

/* ─── Compass Body ───────────────────────────────────────────── */
.compass-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 20px 24px;
}

/* ─── Heading Display ────────────────────────────────────────── */
.heading-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0 16px;
}

.heading-degrees-row {
  display: flex;
  align-items: baseline;
}

.heading-degrees {
  font-size: 64px;
  font-weight: 200;
  color: var(--color-text);
  letter-spacing: -3px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.heading-symbol {
  font-size: 36px;
  font-weight: 200;
  color: var(--color-text-secondary);
  margin-left: 2px;
}

.heading-direction {
  font-size: 18px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-top: 4px;
  letter-spacing: 2px;
  text-transform: uppercase;
  transition: color 0.3s ease;
}

.heading-direction.locked {
  color: var(--color-accent);
}

/* ─── Compass Container ─────────────────────────────────────── */
.compass-container {
  position: relative;
  width: 280px;
  height: 280px;
  flex-shrink: 0;
  margin-bottom: 16px;
}

.heading-indicator {
  position: absolute;
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  width: 16px;
  height: 12px;
  color: var(--color-accent);
}

.heading-indicator svg {
  width: 100%;
  height: 100%;
}

.compass-svg {
  width: 100%;
  height: 100%;
}

/* ─── Compass SVG Styles ────────────────────────────────────── */
.ring-outer {
  fill: none;
  stroke: rgba(0, 0, 0, 0.08);
  stroke-width: 1.5;
}

.ring-inner {
  fill: var(--glass-bg);
  stroke: var(--color-border);
  stroke-width: 0.5;
}

.tick-minor {
  stroke: rgba(0, 0, 0, 0.12);
  stroke-width: 1;
  stroke-linecap: round;
}

.tick-major {
  stroke: rgba(0, 0, 0, 0.25);
  stroke-width: 1.5;
  stroke-linecap: round;
}

.tick-label {
  font-size: 10px;
  font-weight: 500;
  fill: var(--color-text-tertiary);
  font-family: inherit;
}

.cardinal-label {
  font-size: 18px;
  font-weight: 600;
  fill: var(--color-text);
  font-family: inherit;
}

.cardinal-north {
  fill: #e53935;
}

.intercardinal-label {
  font-size: 11px;
  font-weight: 500;
  fill: var(--color-text-tertiary);
  font-family: inherit;
}

.needle-north {
  fill: #e53935;
  opacity: 0.9;
}

.needle-south {
  fill: var(--color-text-muted);
  opacity: 0.4;
}

.center-dot {
  fill: var(--color-text);
  stroke: none;
}

.crosshair {
  stroke: rgba(0, 0, 0, 0.06);
  stroke-width: 0.5;
}

/* ─── Lock Button ────────────────────────────────────────────── */
.lock-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 24px;
  background: rgba(0, 0, 0, 0.04);
  border: none;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 20px;
}

.lock-btn:active {
  transform: scale(0.96);
}

.lock-btn.active {
  background: var(--color-accent);
  color: #fff;
}

.lock-btn svg {
  width: 18px;
  height: 18px;
}

/* ─── Info Cards ─────────────────────────────────────────────── */
.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  width: 100%;
  max-width: 400px;
}

.info-card {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-card svg {
  width: 18px;
  height: 18px;
  color: var(--color-text-tertiary);
}

.info-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

/* ─── Not Available ──────────────────────────────────────────── */
.not-available {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px 20px;
}

.not-available-icon {
  width: 56px;
  height: 56px;
  opacity: 0.15;
}

.not-available-icon svg {
  width: 100%;
  height: 100%;
}

.not-available-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.not-available-desc {
  font-size: 13px;
  color: var(--color-text-tertiary);
  text-align: center;
  line-height: 1.5;
}

/* ─── Calibrating ────────────────────────────────────────────── */
.calibrating {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid var(--color-text-muted);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ─── Home Bar ──────────────────────────────────────────────── */
.home-bar-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  height: 44px;
  padding-bottom: env(safe-area-inset-bottom, 8px);
  background: transparent;
  touch-action: none;
  cursor: grab;
}

.home-bar {
  width: 134px;
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.2);
}

/* ─── Responsive ─────────────────────────────────────────────── */
@media (min-width: 768px) {
  .compass-container {
    width: 340px;
    height: 340px;
  }

  .heading-degrees {
    font-size: 80px;
  }
}
</style>
