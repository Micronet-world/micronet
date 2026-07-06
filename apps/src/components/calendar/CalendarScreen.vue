<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSwipeGestures } from 'micronet-kernel'
import { useCalendarStore, type CalendarEvent } from 'micronet-kernel'
import { useNavigation } from '../../kernel'

const { t } = useI18n()
const { goBack, goHome } = useNavigation()

const { targetRef, isDragging } = useSwipeGestures({
  onSwipeRight: () => goBack(),
})

const { targetRef: barTargetRef } =
  useSwipeGestures({
    onSwipeUp: () => goHome(),
    threshold: 40,
  })

const { addEvent, updateEvent, deleteEvent, getEventsForDate } = useCalendarStore()

// ─── State ──────────────────────────────────────────────────────
const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())
const selectedDate = ref(formatDate(today))
const showModal = ref(false)
const editingEvent = ref<CalendarEvent | null>(null)
const slideDirection = ref<'left' | 'right'>('right')

const eventTitle = ref('')
const eventStartTime = ref('')
const eventEndTime = ref('')
const eventColor = ref('#007aff')
const eventNotes = ref('')

const EVENT_COLORS = [
  { value: '#007aff', name: 'Blue' },
  { value: '#ff3b30', name: 'Red' },
  { value: '#ff9500', name: 'Orange' },
  { value: '#ffcc00', name: 'Yellow' },
  { value: '#34c759', name: 'Green' },
  { value: '#5856d6', name: 'Purple' },
  { value: '#af52de', name: 'Violet' },
  { value: '#ff2d55', name: 'Pink' },
]

// ─── Helpers ────────────────────────────────────────────────────
function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const monthNames = computed(() => [
  t('time.months.january'), t('time.months.february'), t('time.months.march'),
  t('time.months.april'), t('time.months.may'), t('time.months.june'),
  t('time.months.july'), t('time.months.august'), t('time.months.september'),
  t('time.months.october'), t('time.months.november'), t('time.months.december'),
])

const weekDays = computed(() => [
  t('calendar.su'), t('calendar.mo'), t('calendar.tu'), t('calendar.we'),
  t('calendar.th'), t('calendar.fr'), t('calendar.sa'),
])

const monthKey = computed(() => `${viewYear.value}-${viewMonth.value}`)

// ─── Calendar Grid ──────────────────────────────────────────────
interface CalendarDay {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  hasEvents: boolean
  eventCount: number
}

const calendarDays = computed<CalendarDay[]>(() => {
  const year = viewYear.value
  const month = viewMonth.value
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()

  const days: CalendarDay[] = []

  const prevMonthLast = new Date(year, month, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLast - i
    const dt = new Date(year, month - 1, d)
    const dateStr = formatDate(dt)
    const count = getEventsForDate(dateStr).length
    days.push({ date: dateStr, day: d, isCurrentMonth: false, isToday: dateStr === formatDate(today), hasEvents: count > 0, eventCount: count })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d)
    const dateStr = formatDate(dt)
    const count = getEventsForDate(dateStr).length
    days.push({ date: dateStr, day: d, isCurrentMonth: true, isToday: dateStr === formatDate(today), hasEvents: count > 0, eventCount: count })
  }

  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const dt = new Date(year, month + 1, d)
    const dateStr = formatDate(dt)
    const count = getEventsForDate(dateStr).length
    days.push({ date: dateStr, day: d, isCurrentMonth: false, isToday: dateStr === formatDate(today), hasEvents: count > 0, eventCount: count })
  }

  return days
})

// ─── Selected Day Events ────────────────────────────────────────
const selectedDayEvents = computed(() => getEventsForDate(selectedDate.value))

const selectedDayLabel = computed(() => {
  const parts = selectedDate.value.split('-')
  const d = new Date(+parts[0], +parts[1] - 1, +parts[2])
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
  return `${t(`time.days.${dayKeys[d.getDay()]}`)}, ${monthNames.value[d.getMonth()]} ${d.getDate()}`
})

// ─── Navigation ─────────────────────────────────────────────────
function prevMonth() {
  slideDirection.value = 'left'
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}

function nextMonth() {
  slideDirection.value = 'right'
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}

function goToToday() {
  const now = new Date()
  const nowMonth = now.getMonth()
  const nowYear = now.getFullYear()
  slideDirection.value = nowYear > viewYear.value || (nowYear === viewYear.value && nowMonth > viewMonth.value) ? 'right' : 'left'
  viewYear.value = nowYear
  viewMonth.value = nowMonth
  selectedDate.value = formatDate(now)
}

function selectDay(date: string) {
  selectedDate.value = date
}

// ─── Event Modal ────────────────────────────────────────────────
function openNewEvent() {
  editingEvent.value = null
  eventTitle.value = ''
  eventStartTime.value = ''
  eventEndTime.value = ''
  eventColor.value = '#007aff'
  eventNotes.value = ''
  showModal.value = true
}

function openEditEvent(event: CalendarEvent) {
  editingEvent.value = event
  eventTitle.value = event.title
  eventStartTime.value = event.startTime || ''
  eventEndTime.value = event.endTime || ''
  eventColor.value = event.color
  eventNotes.value = event.notes || ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingEvent.value = null
}

function saveEvent() {
  if (!eventTitle.value.trim()) return

  if (editingEvent.value) {
    updateEvent(editingEvent.value.id, {
      title: eventTitle.value.trim(),
      startTime: eventStartTime.value || undefined,
      endTime: eventEndTime.value || undefined,
      color: eventColor.value,
      notes: eventNotes.value.trim() || undefined,
    })
  } else {
    addEvent({
      title: eventTitle.value.trim(),
      date: selectedDate.value,
      startTime: eventStartTime.value || undefined,
      endTime: eventEndTime.value || undefined,
      color: eventColor.value,
      notes: eventNotes.value.trim() || undefined,
    })
  }
  closeModal()
}

function handleDeleteEvent() {
  if (editingEvent.value) {
    deleteEvent(editingEvent.value.id)
    closeModal()
  }
}

function formatEventTime(time: string): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}
</script>

<template>
  <div :ref="targetRef" class="calendar-screen" :class="{ dragging: isDragging }">
    <div class="wallpaper"></div>
    <div class="content">
      <!-- Header -->
      <div class="header">
        <div class="header-top">
          <h1 class="header-title">{{ t('calendar.title') }}</h1>
          <button class="today-pill" @click="goToToday">
            {{ t('calendar.today') }}
          </button>
        </div>

        <!-- Month Navigation -->
        <div class="month-nav">
          <button class="nav-btn" @click="prevMonth" aria-label="Previous month">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <Transition :name="slideDirection === 'right' ? 'slide-right' : 'slide-left'" mode="out-in">
            <span :key="monthKey" class="month-label">{{ monthNames[viewMonth] }} {{ viewYear }}</span>
          </Transition>
          <button class="nav-btn" @click="nextMonth" aria-label="Next month">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <!-- Weekday Headers -->
        <div class="weekday-row">
          <span v-for="day in weekDays" :key="day" class="weekday">{{ day }}</span>
        </div>
      </div>

      <!-- Calendar Grid -->
      <Transition :name="slideDirection === 'right' ? 'slide-right' : 'slide-left'" mode="out-in">
        <div :key="monthKey" class="calendar-grid">
          <button
            v-for="day in calendarDays"
            :key="day.date"
            class="day-cell"
            :class="{
              'other-month': !day.isCurrentMonth,
              'is-today': day.isToday,
              'is-selected': day.date === selectedDate,
            }"
            @click="selectDay(day.date)"
          >
            <span class="day-number">{{ day.day }}</span>
            <div class="event-indicator" v-if="day.hasEvents">
              <span
                v-for="(ev, j) in getEventsForDate(day.date).slice(0, 3)"
                :key="j"
                class="event-pip"
                :style="{ background: ev.color }"
              ></span>
            </div>
          </button>
        </div>
      </Transition>

      <!-- Selected Day Events -->
      <div class="day-events">
        <div class="day-events-header">
          <div class="day-events-label-wrap">
            <span class="day-events-label">{{ selectedDayLabel }}</span>
            <span v-if="selectedDayEvents.length > 0" class="event-count">{{ selectedDayEvents.length }}</span>
          </div>
          <button class="add-event-btn" @click="openNewEvent" aria-label="Add event">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <Transition name="fade" mode="out-in">
          <div v-if="selectedDayEvents.length === 0" key="empty" class="no-events">
            <div class="empty-illustration">
              <svg viewBox="0 0 48 48" fill="none">
                <rect x="6" y="10" width="36" height="32" rx="4" stroke="currentColor" stroke-width="1.5" />
                <line x1="6" y1="18" x2="42" y2="18" stroke="currentColor" stroke-width="1.5" />
                <line x1="16" y1="6" x2="16" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <line x1="32" y1="6" x2="32" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </div>
            <span class="empty-text">{{ t('calendar.noEvents') }}</span>
          </div>

          <div v-else key="list" class="event-list">
            <button
              v-for="event in selectedDayEvents"
              :key="event.id"
              class="event-item"
              @click="openEditEvent(event)"
            >
              <div class="event-color-bar" :style="{ background: event.color }"></div>
              <div class="event-info">
                <span class="event-title">{{ event.title }}</span>
                <span v-if="event.startTime" class="event-time">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="time-icon">
                    <circle cx="8" cy="8" r="6.5" />
                    <path d="M8 4.5V8l2.5 2" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  {{ formatEventTime(event.startTime) }}{{ event.endTime ? ` – ${formatEventTime(event.endTime)}` : '' }}
                </span>
                <span v-if="event.notes" class="event-notes">{{ event.notes }}</span>
              </div>
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Event Modal -->
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
          <div class="modal-handle"></div>
          <div class="modal-header">
            <button class="modal-close" @click="closeModal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
              </svg>
            </button>
            <span class="modal-title">{{ editingEvent ? t('calendar.editEvent') : t('calendar.newEvent') }}</span>
            <button class="modal-save" :disabled="!eventTitle.trim()" @click="saveEvent">{{ t('calendar.save') }}</button>
          </div>

          <div class="modal-body">
            <div class="title-row">
              <div class="color-dot-large" :style="{ background: eventColor }"></div>
              <input
                v-model="eventTitle"
                type="text"
                class="modal-input title-input"
                :placeholder="t('calendar.titlePlaceholder')"
              />
            </div>

            <div class="modal-section">
              <div class="modal-row">
                <span class="modal-label">{{ t('calendar.startTime') }}</span>
                <input v-model="eventStartTime" type="time" class="modal-input time-input" />
              </div>
              <div class="modal-divider"></div>
              <div class="modal-row">
                <span class="modal-label">{{ t('calendar.endTime') }}</span>
                <input v-model="eventEndTime" type="time" class="modal-input time-input" />
              </div>
            </div>

            <div class="modal-section">
              <span class="modal-section-label">{{ t('calendar.color') }}</span>
              <div class="color-picker">
                <button
                  v-for="color in EVENT_COLORS"
                  :key="color.value"
                  class="color-dot"
                  :class="{ active: eventColor === color.value }"
                  :style="{ background: color.value }"
                  @click="eventColor = color.value"
                >
                  <svg v-if="eventColor === color.value" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="2.5">
                    <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="modal-section">
              <span class="modal-section-label">{{ t('calendar.notes') }}</span>
              <textarea
                v-model="eventNotes"
                class="modal-input notes-input"
                :placeholder="t('calendar.notesPlaceholder')"
                rows="3"
              ></textarea>
            </div>

            <button v-if="editingEvent" class="delete-event-btn" @click="handleDeleteEvent">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                <polyline points="3 5 5 5 17 5" stroke-linecap="round" />
                <path d="M15 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5m3 0V3.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5V5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ t('calendar.deleteEvent') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Home Bar -->
    <div
      :ref="barTargetRef"
      class="home-bar-area"
    >
      <div class="home-bar"></div>
    </div>
  </div>
</template>

<style scoped>
.calendar-screen {
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
  padding: calc(env(safe-area-inset-top, 12px) + 16px) 20px 0;
}

.header-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.5px;
}

.today-pill {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 6px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.today-pill:active {
  background: rgba(0, 0, 0, 0.04);
  transform: scale(0.98);
}

/* ─── Month Navigation ───────────────────────────────────────── */
.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 16px;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: none;
  border: none;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:active {
  background: rgba(0, 0, 0, 0.05);
  transform: scale(0.95);
}

.nav-btn svg {
  width: 16px;
  height: 16px;
}

.month-label {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text);
  letter-spacing: 0.3px;
}

/* ─── Month Slide Transitions ────────────────────────────────── */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-left-enter-from { transform: translateX(-20px); opacity: 0; }
.slide-left-leave-to { transform: translateX(20px); opacity: 0; }
.slide-right-enter-from { transform: translateX(20px); opacity: 0; }
.slide-right-leave-to { transform: translateX(-20px); opacity: 0; }

/* ─── Weekday Row ────────────────────────────────────────────── */
.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 0 0 8px;
}

.weekday {
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  letter-spacing: 0.5px;
}

/* ─── Calendar Grid ──────────────────────────────────────────── */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 0 12px 16px;
  flex-shrink: 0;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 50%;
  position: relative;
  transition: all 0.2s ease;
}

.day-cell:active {
  transform: scale(0.92);
}

.day-number {
  font-size: 15px;
  font-weight: 400;
  color: var(--color-text);
  line-height: 1;
  transition: all 0.2s ease;
}

.day-cell.other-month .day-number {
  color: var(--color-text-muted);
  opacity: 0.4;
}

.day-cell.is-today .day-number {
  color: var(--color-accent);
  font-weight: 600;
}

.day-cell.is-selected {
  background: var(--color-text);
}

.day-cell.is-selected .day-number {
  color: #fff;
  font-weight: 500;
}

.day-cell.is-selected.other-month .day-number {
  color: rgba(255, 255, 255, 0.7);
}

.day-cell.is-selected .event-pip {
  background: rgba(255, 255, 255, 0.8) !important;
}

/* ─── Event Indicator ────────────────────────────────────────── */
.event-indicator {
  display: flex;
  gap: 3px;
  height: 4px;
}

.event-pip {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

/* ─── Day Events ─────────────────────────────────────────────── */
.day-events {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 20px 20px;
}

.day-events-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0 12px;
  position: sticky;
  top: 0;
  background: var(--color-bg-warm-to);
  z-index: 2;
}

.day-events-label-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.day-events-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  letter-spacing: 0.3px;
}

.event-count {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
  padding: 2px 8px;
  min-width: 20px;
  text-align: center;
  line-height: 1.4;
}

.add-event-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-text);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.add-event-btn:active {
  transform: scale(0.85);
  background: #333;
}

.add-event-btn svg {
  width: 16px;
  height: 16px;
}

/* ─── Empty State ────────────────────────────────────────────── */
.no-events {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 0;
  color: var(--color-text-muted);
}

.empty-illustration {
  width: 48px;
  height: 48px;
  opacity: 0.2;
}

.empty-illustration svg {
  width: 100%;
  height: 100%;
}

.empty-text {
  font-size: 14px;
  font-weight: 400;
  color: var(--color-text-tertiary);
}

/* ─── Fade Transition ────────────────────────────────────────── */
.fade-enter-active { transition: opacity 0.2s ease; }
.fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ─── Event List ─────────────────────────────────────────────── */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.event-item {
  display: flex;
  align-items: stretch;
  gap: 14px;
  background: var(--color-bg);
  border-radius: 14px;
  padding: 16px;
  cursor: pointer;
  border: none;
  text-align: left;
  width: 100%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.event-item:active {
  transform: scale(0.99);
  background: #fafafa;
}

.event-color-bar {
  width: 3px;
  border-radius: 2px;
  flex-shrink: 0;
}

.event-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.event-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text);
  letter-spacing: -0.1px;
}

.event-time {
  font-size: 13px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  opacity: 0.4;
}

.event-notes {
  font-size: 13px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ─── Modal ──────────────────────────────────────────────────── */
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

.modal-save:disabled {
  color: var(--color-text-muted);
  cursor: default;
}

.modal-body {
  padding: 8px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.color-dot-large {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.modal-input {
  width: 100%;
  font-size: 15px;
  font-family: inherit;
  color: var(--color-text);
  background: rgba(0, 0, 0, 0.03);
  border: none;
  border-radius: 12px;
  padding: 14px;
  outline: none;
  transition: all 0.2s ease;
}

.modal-input:focus {
  background: rgba(0, 0, 0, 0.05);
}

.modal-input::placeholder {
  color: var(--color-text-muted);
}

.title-input {
  font-size: 17px;
  font-weight: 500;
  background: transparent;
  padding: 12px 0;
  letter-spacing: -0.2px;
}

.title-input:focus {
  background: transparent;
}

.modal-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal-section-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.modal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
}

.modal-divider {
  height: 0.5px;
  background: rgba(0, 0, 0, 0.06);
  margin: 0 0 0 70px;
}

.modal-label {
  font-size: 15px;
  color: var(--color-text);
  flex-shrink: 0;
}

.time-input {
  width: auto;
  text-align: right;
  border: none;
  background: transparent;
  padding: 4px 0;
  font-size: 15px;
  font-weight: 400;
  color: var(--color-accent);
}

.time-input:focus {
  border: none;
  box-shadow: none;
}

.color-picker {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.color-dot svg {
  width: 12px;
  height: 12px;
}

.color-dot:active {
  transform: scale(0.9);
}

.color-dot.active {
  border-color: var(--color-text);
  transform: scale(1.1);
}

.notes-input {
  resize: none;
  min-height: 72px;
  font-size: 14px;
  line-height: 1.5;
}

.delete-event-btn {
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
  margin-top: 8px;
  transition: all 0.15s ease;
}

.delete-event-btn svg {
  width: 16px;
  height: 16px;
}

.delete-event-btn:active {
  transform: scale(0.98);
  background: rgba(255, 59, 48, 0.1);
}

/* ─── Modal Transition ───────────────────────────────────────── */
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

/* ─── Home Bar ─────────────────────────────────────────────── */
.home-bar-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 44px;
  padding: 8px 0 calc(env(safe-area-inset-bottom, 8px) + 8px);
  background: transparent;
  touch-action: none;
  cursor: grab;
}

.home-bar {
  width: 134px;
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.3);
}

/* ─── Responsive ─────────────────────────────────────────────── */
@media (min-width: 768px) {
  .calendar-grid {
    padding: 0 24px 20px;
  }

  .day-number {
    font-size: 17px;
  }

  .header-title {
    font-size: 36px;
  }

  .event-item {
    padding: 18px;
  }
}
</style>
