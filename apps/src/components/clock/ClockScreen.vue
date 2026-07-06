<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSwipeGestures } from 'micronet-kernel'
import { useNavigation } from '../../kernel'

const { t } = useI18n()
const { goBack, goHome } = useNavigation()

const { targetRef, isDragging } = useSwipeGestures({
  onSwipeRight: () => goBack(),
})

const { targetRef: barTargetRef } = useSwipeGestures({ onSwipeUp: () => goHome(), threshold: 40 })

// ─── Tabs ───────────────────────────────────────────────────────
type Tab = 'world' | 'alarm' | 'stopwatch' | 'timer'
const activeTab = ref<Tab>('world')

const tabs = computed(() => [
  { id: 'world' as Tab, label: t('clock.worldClock'), icon: 'globe' },
  { id: 'alarm' as Tab, label: t('clock.alarm'), icon: 'alarm' },
  { id: 'stopwatch' as Tab, label: t('clock.stopwatch'), icon: 'stopwatch' },
  { id: 'timer' as Tab, label: t('clock.timer'), icon: 'timer' },
])

// ─── World Clock ────────────────────────────────────────────────
interface WorldCity {
  id: string
  name: string
  timezone: string
  offset: number
}

const AVAILABLE_CITIES: WorldCity[] = [
  { id: 'nyc', name: 'New York', timezone: 'EST', offset: -5 },
  { id: 'london', name: 'London', timezone: 'GMT', offset: 0 },
  { id: 'paris', name: 'Paris', timezone: 'CET', offset: 1 },
  { id: 'moscow', name: 'Moscow', timezone: 'MSK', offset: 3 },
  { id: 'dubai', name: 'Dubai', timezone: 'GST', offset: 4 },
  { id: 'beijing', name: 'Beijing', timezone: 'CST', offset: 8 },
  { id: 'tokyo', name: 'Tokyo', timezone: 'JST', offset: 9 },
  { id: 'sydney', name: 'Sydney', timezone: 'AEST', offset: 10 },
  { id: 'la', name: 'Los Angeles', timezone: 'PST', offset: -8 },
  { id: 'chicago', name: 'Chicago', timezone: 'CST', offset: -6 },
  { id: 'denver', name: 'Denver', timezone: 'MST', offset: -7 },
  { id: 'honolulu', name: 'Honolulu', timezone: 'HST', offset: -10 },
  { id: 'sao_paulo', name: 'São Paulo', timezone: 'BRT', offset: -3 },
  { id: 'mumbai', name: 'Mumbai', timezone: 'IST', offset: 5.5 },
  { id: 'singapore', name: 'Singapore', timezone: 'SGT', offset: 8 },
  { id: 'seoul', name: 'Seoul', timezone: 'KST', offset: 9 },
  { id: 'auckland', name: 'Auckland', timezone: 'NZST', offset: 12 },
  { id: 'cairo', name: 'Cairo', timezone: 'EET', offset: 2 },
  { id: 'bangkok', name: 'Bangkok', timezone: 'ICT', offset: 7 },
  { id: 'hong_kong', name: 'Hong Kong', timezone: 'HKT', offset: 8 },
]

const selectedCities = ref<WorldCity[]>([
  AVAILABLE_CITIES.find(c => c.id === 'nyc')!,
  AVAILABLE_CITIES.find(c => c.id === 'london')!,
  AVAILABLE_CITIES.find(c => c.id === 'tokyo')!,
])

const showCityPicker = ref(false)
const editingWorldClock = ref(false)
const now = ref(new Date())
let worldClockTimer: ReturnType<typeof setInterval> | null = null

function startWorldClock() {
  worldClockTimer = setInterval(() => { now.value = new Date() }, 1000)
}
startWorldClock()

onUnmounted(() => {
  if (worldClockTimer) clearInterval(worldClockTimer)
})

function getCityTime(city: WorldCity): Date {
  const utc = now.value.getTime() + now.value.getTimezoneOffset() * 60000
  return new Date(utc + city.offset * 3600000)
}

function formatCityTime(city: WorldCity): string {
  const d = getCityTime(city)
  const h = d.getHours()
  const m = d.getMinutes()
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

function getCityDayOffset(city: WorldCity): string {
  const local = now.value
  const cityTime = getCityTime(city)
  const localDay = local.getDate()
  const cityDay = cityTime.getDate()
  if (cityDay > localDay || (cityDay === 1 && localDay > 28)) return t('clock.timer') === 'Timer' ? '+1 day' : '+1天'
  if (cityDay < localDay || (localDay === 1 && cityDay > 28)) return t('clock.timer') === 'Timer' ? '-1 day' : '-1天'
  return ''
}

function isDaytime(city: WorldCity): boolean {
  const h = getCityTime(city).getHours()
  return h >= 6 && h < 18
}

function removeCity(id: string) {
  selectedCities.value = selectedCities.value.filter(c => c.id !== id)
}

function addCity(city: WorldCity) {
  if (!selectedCities.value.find(c => c.id === city.id)) {
    selectedCities.value.push(city)
  }
  showCityPicker.value = false
}

const availableToAdd = computed(() =>
  AVAILABLE_CITIES.filter(c => !selectedCities.value.find(s => s.id === c.id))
)

// ─── Alarm ──────────────────────────────────────────────────────
interface Alarm {
  id: string
  hour: number
  minute: number
  enabled: boolean
  label: string
  repeat: string
  sound: boolean
  snooze: boolean
}

const alarms = ref<Alarm[]>([
  { id: '1', hour: 7, minute: 0, enabled: true, label: 'Wake Up', repeat: 'weekdays', sound: true, snooze: true },
  { id: '2', hour: 22, minute: 30, enabled: false, label: 'Bedtime', repeat: 'never', sound: true, snooze: false },
])

const showAlarmModal = ref(false)
const editingAlarm = ref<Alarm | null>(null)
const alarmHour = ref(7)
const alarmMinute = ref(0)
const alarmLabel = ref('')
const alarmRepeat = ref('never')
const alarmSound = ref(true)
const alarmSnooze = ref(true)

const REPEAT_OPTIONS = computed(() => [
  { value: 'never', label: t('clock.never') },
  { value: 'every_day', label: t('clock.everyDay') },
  { value: 'weekdays', label: t('clock.weekdays') },
  { value: 'weekends', label: t('clock.weekends') },
])

function openNewAlarm() {
  editingAlarm.value = null
  const now = new Date()
  alarmHour.value = now.getHours()
  alarmMinute.value = now.getMinutes()
  alarmLabel.value = ''
  alarmRepeat.value = 'never'
  alarmSound.value = true
  alarmSnooze.value = true
  showAlarmModal.value = true
}

function openEditAlarm(alarm: Alarm) {
  editingAlarm.value = alarm
  alarmHour.value = alarm.hour
  alarmMinute.value = alarm.minute
  alarmLabel.value = alarm.label
  alarmRepeat.value = alarm.repeat
  alarmSound.value = alarm.sound
  alarmSnooze.value = alarm.snooze
  showAlarmModal.value = true
}

function saveAlarm() {
  if (editingAlarm.value) {
    const idx = alarms.value.findIndex(a => a.id === editingAlarm.value!.id)
    if (idx >= 0) {
      alarms.value[idx] = {
        ...alarms.value[idx],
        hour: alarmHour.value,
        minute: alarmMinute.value,
        label: alarmLabel.value,
        repeat: alarmRepeat.value,
        sound: alarmSound.value,
        snooze: alarmSnooze.value,
      }
    }
  } else {
    alarms.value.push({
      id: Date.now().toString(),
      hour: alarmHour.value,
      minute: alarmMinute.value,
      enabled: true,
      label: alarmLabel.value,
      repeat: alarmRepeat.value,
      sound: alarmSound.value,
      snooze: alarmSnooze.value,
    })
  }
  showAlarmModal.value = false
}

function deleteAlarm(id: string) {
  alarms.value = alarms.value.filter(a => a.id !== id)
  showAlarmModal.value = false
}

function toggleAlarm(id: string) {
  const alarm = alarms.value.find(a => a.id === id)
  if (alarm) alarm.enabled = !alarm.enabled
}

function formatAlarmTime(h: number, m: number): string {
  const hour12 = h % 12 || 12
  return `${hour12}:${String(m).padStart(2, '0')}`
}

function formatAlarmPeriod(h: number): string {
  return h >= 12 ? 'PM' : 'AM'
}

function getRepeatLabel(repeat: string): string {
  const opt = REPEAT_OPTIONS.value.find(o => o.value === repeat)
  return opt ? opt.label : repeat
}

function incrementHour() {
  alarmHour.value = (alarmHour.value + 1) % 24
}

function decrementHour() {
  alarmHour.value = (alarmHour.value + 23) % 24
}

function incrementMinute() {
  alarmMinute.value = (alarmMinute.value + 1) % 60
}

function decrementMinute() {
  alarmMinute.value = (alarmMinute.value + 59) % 60
}

// ─── Stopwatch ──────────────────────────────────────────────────
const stopwatchRunning = ref(false)
const stopwatchElapsed = ref(0)
const stopwatchStartTime = ref(0)
const laps = ref<number[]>([])
let stopwatchTimer: ReturnType<typeof setInterval> | null = null

function startStopwatch() {
  if (stopwatchRunning.value) {
    stopwatchRunning.value = false
    if (stopwatchTimer) clearInterval(stopwatchTimer)
    stopwatchTimer = null
  } else {
    stopwatchRunning.value = true
    stopwatchStartTime.value = Date.now() - stopwatchElapsed.value
    stopwatchTimer = setInterval(() => {
      stopwatchElapsed.value = Date.now() - stopwatchStartTime.value
    }, 10)
  }
}

function resetStopwatch() {
  stopwatchRunning.value = false
  if (stopwatchTimer) clearInterval(stopwatchTimer)
  stopwatchTimer = null
  stopwatchElapsed.value = 0
  stopwatchStartTime.value = 0
  laps.value = []
}

function recordLap() {
  if (stopwatchRunning.value) {
    laps.value.unshift(stopwatchElapsed.value)
  }
}

function formatStopwatch(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  const centis = Math.floor((ms % 1000) / 10)
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(centis).padStart(2, '0')}`
}

function formatLapTime(ms: number): string {
  return formatStopwatch(ms)
}

function getLapDelta(index: number): number {
  if (index === laps.value.length - 1) return laps.value[index]
  return laps.value[index] - laps.value[index + 1]
}

const bestLapIndex = computed(() => {
  if (laps.value.length < 2) return -1
  let best = 0
  let bestDelta = Infinity
  laps.value.forEach((_, i) => {
    const delta = getLapDelta(i)
    if (delta < bestDelta) { bestDelta = delta; best = i }
  })
  return best
})

const worstLapIndex = computed(() => {
  if (laps.value.length < 2) return -1
  let worst = 0
  let worstDelta = 0
  laps.value.forEach((_, i) => {
    const delta = getLapDelta(i)
    if (delta > worstDelta) { worstDelta = delta; worst = i }
  })
  return worst
})

onUnmounted(() => {
  if (stopwatchTimer) clearInterval(stopwatchTimer)
})

// ─── Timer ──────────────────────────────────────────────────────
const timerRunning = ref(false)
const timerRemaining = ref(0)
const timerDuration = ref(300)
const timerHours = ref(0)
const timerMinutes = ref(5)
const timerSeconds = ref(0)
const timerFinished = ref(false)
let timerInterval: ReturnType<typeof setInterval> | null = null

const TIMER_PRESETS = [60, 180, 300, 600, 900, 1800, 3600]

function setTimerPreset(seconds: number) {
  timerDuration.value = seconds
  timerHours.value = Math.floor(seconds / 3600)
  timerMinutes.value = Math.floor((seconds % 3600) / 60)
  timerSeconds.value = seconds % 60
}

function startTimer() {
  if (timerFinished.value) {
    timerFinished.value = false
    timerRemaining.value = timerDuration.value
  }
  if (timerRemaining.value <= 0) {
    timerDuration.value = timerHours.value * 3600 + timerMinutes.value * 60 + timerSeconds.value
    timerRemaining.value = timerDuration.value
  }
  if (timerRemaining.value <= 0) return
  timerRunning.value = true
  timerInterval = setInterval(() => {
    timerRemaining.value--
    if (timerRemaining.value <= 0) {
      timerRunning.value = false
      timerFinished.value = true
      if (timerInterval) clearInterval(timerInterval)
      timerInterval = null
    }
  }, 1000)
}

function pauseTimer() {
  timerRunning.value = false
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = null
}

function resetTimer() {
  timerRunning.value = false
  timerFinished.value = false
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = null
  timerRemaining.value = 0
  timerHours.value = 0
  timerMinutes.value = 5
  timerSeconds.value = 0
  timerDuration.value = 300
}

function dismissTimerAlert() {
  timerFinished.value = false
  timerRemaining.value = 0
}

function formatTimerDisplay(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const timerProgress = computed(() => {
  if (timerDuration.value === 0) return 0
  return timerRemaining.value / timerDuration.value
})

function formatPresetLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${seconds / 60}m`
  return `${seconds / 3600}h`
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

// ─── Timezone city list for picker ──────────────────────────────
const citySearchQuery = ref('')
const filteredCities = computed(() => {
  if (!citySearchQuery.value) return availableToAdd.value
  const q = citySearchQuery.value.toLowerCase()
  return availableToAdd.value.filter(c => c.name.toLowerCase().includes(q))
})
</script>

<template>
  <div :ref="targetRef" class="clock-screen" :class="{ dragging: isDragging }">
    <div class="wallpaper"></div>
    <div class="content">
      <!-- Header -->
      <div class="header">
        <div class="header-top">
          <button class="header-btn" @click="activeTab === 'world' ? (editingWorldClock = !editingWorldClock) : null">
            <span v-if="activeTab === 'world'">{{ editingWorldClock ? t('clock.done') : t('clock.edit') }}</span>
          </button>
          <h1 class="header-title">{{ tabs.find(tab => tab.id === activeTab)?.label }}</h1>
          <button class="header-btn add-btn" @click="activeTab === 'world' ? (showCityPicker = true) : activeTab === 'alarm' ? openNewAlarm() : null">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- World Clock Tab -->
        <div v-if="activeTab === 'world'" class="world-tab">
          <Transition name="fade" mode="out-in">
            <div v-if="selectedCities.length === 0" key="empty" class="empty-state">
              <div class="empty-icon">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="24" cy="24" r="20" />
                  <path d="M4 24h40M24 4c-5.5 6-8.5 12-8.5 20s3 14 8.5 20c5.5-6 8.5-12 8.5-20s-3-14-8.5-20z" />
                </svg>
              </div>
              <span class="empty-text">{{ t('clock.noCities') }}</span>
              <span class="empty-desc">{{ t('clock.noCitiesDesc') }}</span>
            </div>
            <div v-else key="list" class="city-list">
              <div
                v-for="city in selectedCities"
                :key="city.id"
                class="city-row"
              >
                <div class="city-info">
                  <div class="city-name-row">
                    <span class="city-tz">{{ city.timezone }}</span>
                    <span class="city-name">{{ city.name }}</span>
                    <span v-if="getCityDayOffset(city)" class="city-day-offset">{{ getCityDayOffset(city) }}</span>
                  </div>
                </div>
                <div class="city-time-row">
                  <span class="city-time" :class="{ daytime: isDaytime(city), nighttime: !isDaytime(city) }">{{ formatCityTime(city) }}</span>
                  <button v-if="editingWorldClock" class="delete-city-btn" @click="removeCity(city.id)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="8" y1="12" x2="16" y2="12" stroke-linecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Alarm Tab -->
        <div v-if="activeTab === 'alarm'" class="alarm-tab">
          <Transition name="fade" mode="out-in">
            <div v-if="alarms.length === 0" key="empty" class="empty-state">
              <div class="empty-icon">
                <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="24" cy="26" r="18" />
                  <path d="M24 14v12l8 4" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M8 8l4 4M40 8l-4 4" stroke-linecap="round" />
                </svg>
              </div>
              <span class="empty-text">{{ t('clock.noAlarms') }}</span>
              <span class="empty-desc">{{ t('clock.noAlarmsDesc') }}</span>
            </div>
            <div v-else key="list" class="alarm-list">
              <div
                v-for="alarm in alarms"
                :key="alarm.id"
                class="alarm-row"
                :class="{ disabled: !alarm.enabled }"
                @click="openEditAlarm(alarm)"
              >
                <div class="alarm-time-wrap">
                  <span class="alarm-time">{{ formatAlarmTime(alarm.hour, alarm.minute) }}</span>
                  <span class="alarm-period">{{ formatAlarmPeriod(alarm.hour) }}</span>
                </div>
                <div class="alarm-meta">
                  <span class="alarm-label">{{ alarm.label || t('clock.alarm') }}</span>
                  <span class="alarm-repeat">{{ getRepeatLabel(alarm.repeat) }}</span>
                </div>
                <button class="alarm-toggle" @click.stop="toggleAlarm(alarm.id)">
                  <div class="toggle-track" :class="{ on: alarm.enabled }">
                    <div class="toggle-thumb"></div>
                  </div>
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Stopwatch Tab -->
        <div v-if="activeTab === 'stopwatch'" class="stopwatch-tab">
          <div class="stopwatch-display">
            <span class="stopwatch-time">{{ formatStopwatch(stopwatchElapsed) }}</span>
          </div>
          <div class="stopwatch-controls">
            <button
              class="sw-btn secondary"
              @click="stopwatchRunning ? recordLap() : resetStopwatch()"
            >
              {{ stopwatchRunning ? t('clock.lap') : t('clock.reset') }}
            </button>
            <button
              class="sw-btn primary"
              :class="{ running: stopwatchRunning }"
              @click="startStopwatch()"
            >
              {{ stopwatchRunning ? t('clock.stop') : t('clock.start') }}
            </button>
          </div>
          <div v-if="laps.length > 0" class="laps-container">
            <div class="laps-header">
              <span class="laps-title">{{ t('clock.laps') }}</span>
            </div>
            <div class="laps-list">
              <div
                v-for="(lap, i) in laps"
                :key="i"
                class="lap-row"
                :class="{ best: i === bestLapIndex && laps.length > 1, worst: i === worstLapIndex && laps.length > 1 }"
              >
                <span class="lap-name">{{ t('clock.lapNumber', { number: laps.length - i }) }}</span>
                <span class="lap-delta">{{ formatLapTime(getLapDelta(i)) }}</span>
                <span class="lap-total">{{ formatLapTime(lap) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Timer Tab -->
        <div v-if="activeTab === 'timer'" class="timer-tab">
          <!-- Timer Finished Alert -->
          <Transition name="modal">
            <div v-if="timerFinished" class="timer-alert-overlay" @click="dismissTimerAlert">
              <div class="timer-alert" @click.stop>
                <div class="timer-alert-icon">
                  <svg viewBox="0 0 48 48" fill="none">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2" />
                    <path d="M24 14v12l8 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <span class="timer-alert-text">{{ t('clock.timeIsUp') }}</span>
                <button class="timer-alert-btn" @click="dismissTimerAlert">{{ t('clock.ok') }}</button>
              </div>
            </div>
          </Transition>

          <!-- Timer Display / Setup -->
          <div v-if="!timerRunning && timerRemaining <= 0 && !timerFinished" class="timer-setup">
            <div class="timer-digits">
              <div class="digit-group">
                <button class="digit-btn" @click="timerHours = (timerHours + 1) % 24">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </button>
                <span class="digit-value">{{ String(timerHours).padStart(2, '0') }}</span>
                <button class="digit-btn" @click="timerHours = (timerHours + 23) % 24">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </button>
                <span class="digit-label">{{ t('clock.hours') }}</span>
              </div>
              <span class="digit-sep">:</span>
              <div class="digit-group">
                <button class="digit-btn" @click="timerMinutes = (timerMinutes + 1) % 60">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </button>
                <span class="digit-value">{{ String(timerMinutes).padStart(2, '0') }}</span>
                <button class="digit-btn" @click="timerMinutes = (timerMinutes + 59) % 60">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </button>
                <span class="digit-label">{{ t('clock.minutes') }}</span>
              </div>
              <span class="digit-sep">:</span>
              <div class="digit-group">
                <button class="digit-btn" @click="timerSeconds = (timerSeconds + 1) % 60">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </button>
                <span class="digit-value">{{ String(timerSeconds).padStart(2, '0') }}</span>
                <button class="digit-btn" @click="timerSeconds = (timerSeconds + 59) % 60">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                </button>
                <span class="digit-label">{{ t('clock.timer') === 'Timer' ? 'seconds' : '秒' }}</span>
              </div>
            </div>
            <div class="timer-presets">
              <button
                v-for="preset in TIMER_PRESETS"
                :key="preset"
                class="preset-btn"
                :class="{ active: timerHours * 3600 + timerMinutes * 60 + timerSeconds === preset }"
                @click="setTimerPreset(preset)"
              >
                {{ formatPresetLabel(preset) }}
              </button>
            </div>
          </div>

          <!-- Timer Running / Paused -->
          <div v-else-if="timerRunning || timerRemaining > 0" class="timer-running">
            <div class="timer-ring-container">
              <svg class="timer-ring" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="88" class="ring-bg" />
                <circle
                  cx="100" cy="100" r="88"
                  class="ring-progress"
                  :style="{ strokeDashoffset: (1 - timerProgress) * 553 }"
                />
              </svg>
              <span class="timer-ring-text">{{ formatTimerDisplay(timerRemaining) }}</span>
            </div>
          </div>

          <!-- Timer Controls -->
          <div class="timer-controls">
            <button
              v-if="timerRunning || timerRemaining > 0"
              class="sw-btn secondary"
              @click="resetTimer()"
            >
              {{ t('clock.cancel') }}
            </button>
            <button
              class="sw-btn primary"
              :class="{ running: timerRunning }"
              @click="timerRunning ? pauseTimer() : startTimer()"
            >
              {{ timerRunning ? t('clock.stop') : timerRemaining > 0 ? t('clock.start') : t('clock.start') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tab Bar -->
      <div class="tab-bar">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id; editingWorldClock = false"
        >
          <svg v-if="tab.icon === 'globe'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2c-3 3.5-5 7.5-5 10s2 6.5 5 10c3-3.5 5-7.5 5-10s-2-6.5-5-10z" />
          </svg>
          <svg v-else-if="tab.icon === 'alarm'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2 2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M5 3l2 2M19 3l-2 2" stroke-linecap="round" />
          </svg>
          <svg v-else-if="tab.icon === 'stopwatch'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4" stroke-linecap="round" />
            <path d="M10 2h4M12 2v2" stroke-linecap="round" />
          </svg>
          <svg v-else-if="tab.icon === 'timer'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- City Picker Modal -->
      <Transition name="modal">
        <div v-if="showCityPicker" class="modal-overlay" @click.self="showCityPicker = false">
          <div class="modal city-picker-modal">
            <div class="modal-handle"></div>
            <div class="modal-header">
              <button class="modal-close" @click="showCityPicker = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
                </svg>
              </button>
              <span class="modal-title">{{ t('clock.addCity') }}</span>
              <div style="width: 28px"></div>
            </div>
            <div class="search-bar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" stroke-linecap="round" />
              </svg>
              <input
                v-model="citySearchQuery"
                type="text"
                class="search-input"
                placeholder="Search"
              />
            </div>
            <div class="city-picker-list">
              <button
                v-for="city in filteredCities"
                :key="city.id"
                class="city-picker-row"
                @click="addCity(city)"
              >
                <div class="city-picker-info">
                  <span class="city-picker-name">{{ city.name }}</span>
                  <span class="city-picker-tz">{{ city.timezone }}</span>
                </div>
                <span class="city-picker-time">{{ formatCityTime(city) }}</span>
              </button>
              <div v-if="filteredCities.length === 0" class="empty-picker">
                <span>{{ t('clock.noCities') }}</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Alarm Edit Modal -->
      <Transition name="modal">
        <div v-if="showAlarmModal" class="modal-overlay" @click.self="showAlarmModal = false">
          <div class="modal alarm-modal">
            <div class="modal-handle"></div>
            <div class="modal-header">
              <button class="modal-close" @click="showAlarmModal = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
                </svg>
              </button>
              <span class="modal-title">{{ editingAlarm ? t('clock.editAlarm') : t('clock.newAlarm') }}</span>
              <button class="modal-save" @click="saveAlarm">{{ t('clock.save') }}</button>
            </div>
            <div class="alarm-edit-body">
              <!-- Time Picker -->
              <div class="alarm-time-picker">
                <div class="time-picker-col">
                  <button class="tp-btn" @click="incrementHour">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </button>
                  <span class="tp-value">{{ String(alarmHour).padStart(2, '0') }}</span>
                  <button class="tp-btn" @click="decrementHour">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </button>
                </div>
                <span class="tp-sep">:</span>
                <div class="time-picker-col">
                  <button class="tp-btn" @click="incrementMinute">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </button>
                  <span class="tp-value">{{ String(alarmMinute).padStart(2, '0') }}</span>
                  <button class="tp-btn" @click="decrementMinute">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round" /></svg>
                  </button>
                </div>
              </div>

              <!-- Alarm Options -->
              <div class="alarm-options">
                <div class="alarm-option-row">
                  <span class="option-label">{{ t('clock.repeat') }}</span>
                  <select v-model="alarmRepeat" class="option-select">
                    <option v-for="opt in REPEAT_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                  </select>
                </div>
                <div class="option-divider"></div>
                <div class="alarm-option-row">
                  <span class="option-label">{{ t('clock.label') }}</span>
                  <input v-model="alarmLabel" type="text" class="option-input" :placeholder="t('clock.alarm')" />
                </div>
                <div class="option-divider"></div>
                <div class="alarm-option-row">
                  <span class="option-label">{{ t('clock.sound') }}</span>
                  <button class="toggle-btn" @click="alarmSound = !alarmSound">
                    <div class="toggle-track" :class="{ on: alarmSound }">
                      <div class="toggle-thumb"></div>
                    </div>
                  </button>
                </div>
                <div class="option-divider"></div>
                <div class="alarm-option-row">
                  <span class="option-label">{{ t('clock.snooze') }}</span>
                  <button class="toggle-btn" @click="alarmSnooze = !alarmSnooze">
                    <div class="toggle-track" :class="{ on: alarmSnooze }">
                      <div class="toggle-thumb"></div>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Delete Button -->
              <button v-if="editingAlarm" class="delete-alarm-btn" @click="deleteAlarm(editingAlarm.id)">
                <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                  <polyline points="3 5 5 5 17 5" stroke-linecap="round" />
                  <path d="M15 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5m3 0V3.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5V5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                {{ t('clock.deleteAlarm') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Home Bar -->
    <div class="home-bar-area" :ref="barTargetRef">
      <div class="home-bar"></div>
    </div>
  </div>
</template>

<style scoped>
.home-bar-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  justify-content: center;
  padding: 8px 0 calc(env(safe-area-inset-bottom, 8px) + 4px);
  background: transparent;
  touch-action: none;
}

.home-bar {
  width: 134px;
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.2);
}

.clock-screen {
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
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.2px;
}

.header-btn {
  min-width: 50px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--color-accent);
  font-size: 15px;
  font-weight: 400;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.header-btn:active {
  opacity: 0.5;
}

.add-btn {
  width: 32px;
  min-width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-text);
  color: #fff;
}

.add-btn svg {
  width: 16px;
  height: 16px;
}

.add-btn:active {
  transform: scale(0.9);
}

/* ─── Tab Content ────────────────────────────────────────────── */
.tab-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 20px;
}

/* ─── Tab Bar ────────────────────────────────────────────────── */
.tab-bar {
  flex-shrink: 0;
  display: flex;
  justify-content: space-around;
  padding: 8px 16px calc(env(safe-area-inset-bottom, 8px) + 8px);
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid var(--color-border);
}

.tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s ease;
}

.tab-btn.active {
  color: var(--color-accent);
}

.tab-btn svg {
  width: 22px;
  height: 22px;
}

.tab-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.2px;
}

/* ─── Empty State ────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 20px;
}

.empty-icon {
  width: 56px;
  height: 56px;
  opacity: 0.15;
}

.empty-icon svg {
  width: 100%;
  height: 100%;
}

.empty-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.empty-desc {
  font-size: 13px;
  color: var(--color-text-tertiary);
  text-align: center;
}

/* ─── World Clock ────────────────────────────────────────────── */
.city-list {
  display: flex;
  flex-direction: column;
}

.city-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  border-bottom: 0.5px solid var(--color-border);
  animation: fadeInUp 0.3s ease both;
}

.city-row:nth-child(1) { animation-delay: 0s; }
.city-row:nth-child(2) { animation-delay: 0.05s; }
.city-row:nth-child(3) { animation-delay: 0.1s; }
.city-row:nth-child(4) { animation-delay: 0.15s; }
.city-row:nth-child(5) { animation-delay: 0.2s; }

.city-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.city-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.city-tz {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  letter-spacing: 0.5px;
  min-width: 36px;
}

.city-name {
  font-size: 17px;
  font-weight: 400;
  color: var(--color-text);
}

.city-day-offset {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-accent);
  background: var(--color-accent-soft);
  padding: 2px 8px;
  border-radius: 10px;
}

.city-time-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.city-time {
  font-size: 34px;
  font-weight: 200;
  color: var(--color-text);
  letter-spacing: -1px;
  font-variant-numeric: tabular-nums;
}

.city-time.daytime {
  color: var(--color-text);
}

.city-time.nighttime {
  color: var(--color-text-secondary);
}

.delete-city-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: none;
  border: none;
  color: var(--color-danger);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.delete-city-btn svg {
  width: 20px;
  height: 20px;
}

.delete-city-btn:active {
  transform: scale(0.9);
}

/* ─── Alarm ──────────────────────────────────────────────────── */
.alarm-list {
  display: flex;
  flex-direction: column;
}

.alarm-row {
  display: flex;
  align-items: center;
  padding: 18px 0;
  border-bottom: 0.5px solid var(--color-border);
  cursor: pointer;
  transition: opacity 0.2s ease;
  animation: fadeInUp 0.3s ease both;
}

.alarm-row:nth-child(1) { animation-delay: 0s; }
.alarm-row:nth-child(2) { animation-delay: 0.05s; }

.alarm-row.disabled {
  opacity: 0.4;
}

.alarm-row:active {
  opacity: 0.7;
}

.alarm-time-wrap {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 120px;
}

.alarm-time {
  font-size: 48px;
  font-weight: 200;
  color: var(--color-text);
  letter-spacing: -2px;
  font-variant-numeric: tabular-nums;
}

.alarm-period {
  font-size: 20px;
  font-weight: 200;
  color: var(--color-text-secondary);
}

.alarm-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-left: 12px;
}

.alarm-label {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.alarm-repeat {
  font-size: 11px;
  color: var(--color-text-tertiary);
}

.alarm-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
}

/* ─── Toggle Switch ──────────────────────────────────────────── */
.toggle-track {
  width: 51px;
  height: 31px;
  border-radius: 16px;
  background: rgba(0, 0, 0, 0.1);
  position: relative;
  transition: background 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toggle-track.on {
  background: var(--color-success);
}

.toggle-thumb {
  width: 27px;
  height: 27px;
  border-radius: 50%;
  background: #fff;
  position: absolute;
  top: 2px;
  left: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toggle-track.on .toggle-thumb {
  transform: translateX(20px);
}

/* ─── Stopwatch ──────────────────────────────────────────────── */
.stopwatch-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.stopwatch-display {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0 32px;
}

.stopwatch-time {
  font-size: 72px;
  font-weight: 200;
  color: var(--color-text);
  letter-spacing: -2px;
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum';
}

.stopwatch-controls {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 0 0 24px;
}

.sw-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: none;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.sw-btn:active {
  transform: scale(0.92);
}

.sw-btn.secondary {
  background: rgba(0, 0, 0, 0.08);
  color: var(--color-text);
}

.sw-btn.primary {
  background: var(--color-success);
  color: #fff;
}

.sw-btn.primary.running {
  background: var(--color-danger);
}

/* ─── Laps ───────────────────────────────────────────────────── */
.laps-container {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  border-top: 0.5px solid var(--color-border);
  margin-top: 8px;
}

.laps-header {
  padding: 12px 0 8px;
  position: sticky;
  top: 0;
  background: var(--color-bg-warm-to);
  z-index: 2;
}

.laps-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.laps-list {
  display: flex;
  flex-direction: column;
}

.lap-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 0.5px solid var(--color-border);
  animation: fadeIn 0.15s ease;
}

.lap-name {
  font-size: 15px;
  font-weight: 400;
  color: var(--color-text);
  min-width: 80px;
}

.lap-delta {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  text-align: center;
  flex: 1;
}

.lap-total {
  font-size: 13px;
  color: var(--color-text-tertiary);
  font-variant-numeric: tabular-nums;
  text-align: right;
  min-width: 80px;
}

.lap-row.best .lap-delta {
  color: var(--color-success);
}

.lap-row.worst .lap-delta {
  color: var(--color-danger);
}

/* ─── Timer ──────────────────────────────────────────────────── */
.timer-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
}

.timer-setup {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 32px;
  padding: 24px 0;
}

.timer-digits {
  display: flex;
  align-items: center;
  gap: 8px;
}

.digit-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.digit-btn {
  width: 36px;
  height: 28px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.04);
  border: none;
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.digit-btn:active {
  background: rgba(0, 0, 0, 0.08);
  transform: scale(0.95);
}

.digit-btn svg {
  width: 16px;
  height: 16px;
}

.digit-value {
  font-size: 48px;
  font-weight: 200;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  min-width: 60px;
  text-align: center;
  letter-spacing: -1px;
}

.digit-sep {
  font-size: 40px;
  font-weight: 200;
  color: var(--color-text-tertiary);
  padding-bottom: 24px;
}

.digit-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-transform: lowercase;
}

.timer-presets {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  padding: 0 16px;
}

.preset-btn {
  padding: 8px 18px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
}

.preset-btn:active {
  transform: scale(0.95);
}

.preset-btn.active {
  background: var(--color-accent);
  color: #fff;
}

/* Timer Ring */
.timer-running {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.timer-ring-container {
  position: relative;
  width: 200px;
  height: 200px;
}

.timer-ring {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: rgba(0, 0, 0, 0.06);
  stroke-width: 4;
}

.ring-progress {
  fill: none;
  stroke: var(--color-accent);
  stroke-width: 4;
  stroke-linecap: round;
  stroke-dasharray: 553;
  transition: stroke-dashoffset 0.5s linear;
}

.timer-ring-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  font-weight: 200;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  letter-spacing: -1px;
}

/* Timer Controls */
.timer-controls {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 24px 0 calc(env(safe-area-inset-bottom, 8px) + 60px);
}

/* Timer Alert */
.timer-alert-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-alert {
  background: var(--color-bg);
  border-radius: 20px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  animation: fadeInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  max-width: 280px;
}

.timer-alert-icon {
  width: 56px;
  height: 56px;
  color: var(--color-accent);
}

.timer-alert-icon svg {
  width: 100%;
  height: 100%;
}

.timer-alert-text {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}

.timer-alert-btn {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: var(--color-accent);
  color: #fff;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;
  margin-top: 8px;
}

.timer-alert-btn:active {
  opacity: 0.8;
}

/* ─── Modals ─────────────────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.modal {
  width: 100%;
  max-width: 500px;
  background: var(--color-bg);
  border-radius: 24px 24px 0 0;
  max-height: 85vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.1);
}

.modal-handle {
  width: 32px;
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.1);
  margin: 12px auto 0;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 14px;
  position: sticky;
  top: 0;
  background: var(--color-bg);
  z-index: 2;
}

.modal-close {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  border: none;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal-close:active {
  transform: scale(0.9);
  background: rgba(0, 0, 0, 0.1);
}

.modal-close svg {
  width: 12px;
  height: 12px;
}

.modal-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text);
}

.modal-save {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-accent);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  transition: opacity 0.15s ease;
}

.modal-save:active {
  opacity: 0.5;
}

/* ─── City Picker ────────────────────────────────────────────── */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 20px 12px;
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

.city-picker-list {
  padding: 0 20px 24px;
}

.city-picker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 0;
  border-bottom: 0.5px solid var(--color-border);
  background: none;
  border-left: none;
  border-right: none;
  border-top: none;
  cursor: pointer;
  text-align: left;
  transition: opacity 0.15s ease;
}

.city-picker-row:active {
  opacity: 0.6;
}

.city-picker-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.city-picker-name {
  font-size: 16px;
  font-weight: 400;
  color: var(--color-text);
}

.city-picker-tz {
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.city-picker-time {
  font-size: 18px;
  font-weight: 300;
  color: var(--color-text-secondary);
  font-variant-numeric: tabular-nums;
}

.empty-picker {
  padding: 40px 0;
  text-align: center;
  font-size: 14px;
  color: var(--color-text-tertiary);
}

/* ─── Alarm Edit Modal ───────────────────────────────────────── */
.alarm-edit-body {
  padding: 8px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.alarm-time-picker {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 0;
}

.time-picker-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.tp-btn {
  width: 44px;
  height: 32px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.04);
  border: none;
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tp-btn:active {
  background: rgba(0, 0, 0, 0.08);
  transform: scale(0.95);
}

.tp-btn svg {
  width: 18px;
  height: 18px;
}

.tp-value {
  font-size: 52px;
  font-weight: 200;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
  min-width: 70px;
  text-align: center;
  letter-spacing: -2px;
}

.tp-sep {
  font-size: 44px;
  font-weight: 200;
  color: var(--color-text-tertiary);
  padding-bottom: 24px;
}

.alarm-options {
  background: var(--color-bg);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.alarm-option-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
}

.option-label {
  font-size: 15px;
  color: var(--color-text);
}

.option-select {
  font-size: 15px;
  font-family: inherit;
  color: var(--color-accent);
  background: none;
  border: none;
  outline: none;
  text-align: right;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.option-input {
  font-size: 15px;
  font-family: inherit;
  color: var(--color-accent);
  background: none;
  border: none;
  outline: none;
  text-align: right;
  max-width: 150px;
}

.option-input::placeholder {
  color: var(--color-text-muted);
}

.option-divider {
  height: 0.5px;
  background: var(--color-border);
  margin: 0 16px;
}

.toggle-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.delete-alarm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-danger);
  background: rgba(255, 59, 48, 0.05);
  border: none;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.delete-alarm-btn svg {
  width: 16px;
  height: 16px;
}

.delete-alarm-btn:active {
  transform: scale(0.98);
  background: rgba(255, 59, 48, 0.1);
}

/* ─── Transitions ────────────────────────────────────────────── */
.fade-enter-active { transition: opacity 0.2s ease; }
.fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.modal-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active {
  transition: all 0.25s ease-in;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(100%);
}

/* ─── Responsive ─────────────────────────────────────────────── */
@media (min-width: 768px) {
  .stopwatch-time {
    font-size: 88px;
  }

  .digit-value, .tp-value {
    font-size: 56px;
  }

  .alarm-time {
    font-size: 56px;
  }

  .city-time {
    font-size: 40px;
  }
}
</style>
