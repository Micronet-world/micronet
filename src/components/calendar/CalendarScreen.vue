<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSwipeGestures } from '../../composables/useSwipeGestures'
import { useCalendarStore, type CalendarEvent } from '../../composables/useCalendarStore'

const { t } = useI18n()
const emit = defineEmits<{ 'go-back': []; 'go-home': [] }>()

const { targetRef, isDragging } = useSwipeGestures({
  onSwipeUp: () => emit('go-home'),
  onSwipeRight: () => emit('go-back'),
})

const { addEvent, updateEvent, deleteEvent, getEventsForDate } = useCalendarStore()

// ─── State ──────────────────────────────────────────────────────
const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())
const selectedDate = ref(formatDate(today))
const showModal = ref(false)
const editingEvent = ref<CalendarEvent | null>(null)

const eventTitle = ref('')
const eventStartTime = ref('')
const eventEndTime = ref('')
const eventColor = ref('#007aff')
const eventNotes = ref('')

const EVENT_COLORS = ['#007aff', '#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#5856d6', '#af52de', '#ff2d55']

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

// ─── Calendar Grid ──────────────────────────────────────────────
interface CalendarDay {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  hasEvents: boolean
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
    days.push({ date: dateStr, day: d, isCurrentMonth: false, isToday: dateStr === formatDate(today), hasEvents: getEventsForDate(dateStr).length > 0 })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(year, month, d)
    const dateStr = formatDate(dt)
    days.push({ date: dateStr, day: d, isCurrentMonth: true, isToday: dateStr === formatDate(today), hasEvents: getEventsForDate(dateStr).length > 0 })
  }

  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    const dt = new Date(year, month + 1, d)
    const dateStr = formatDate(dt)
    days.push({ date: dateStr, day: d, isCurrentMonth: false, isToday: dateStr === formatDate(today), hasEvents: getEventsForDate(dateStr).length > 0 })
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
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}

function goToToday() {
  viewYear.value = today.getFullYear()
  viewMonth.value = today.getMonth()
  selectedDate.value = formatDate(today)
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
          <button class="back-btn" @click="emit('go-back')" aria-label="Back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <h1 class="header-title">{{ t('calendar.title') }}</h1>
          <button class="today-btn" @click="goToToday">{{ t('calendar.today') }}</button>
        </div>

        <!-- Month Navigation -->
        <div class="month-nav">
          <button class="nav-btn" @click="prevMonth" aria-label="Previous month">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <span class="month-label">{{ monthNames[viewMonth] }} {{ viewYear }}</span>
          <button class="nav-btn" @click="nextMonth" aria-label="Next month">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
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
      <div class="calendar-grid">
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
          <span v-if="day.hasEvents" class="event-dot" :style="{ background: getEventsForDate(day.date)[0]?.color }"></span>
        </button>
      </div>

      <!-- Selected Day Events -->
      <div class="day-events">
        <div class="day-events-header">
          <span class="day-events-label">{{ selectedDayLabel }}</span>
          <button class="add-event-btn" @click="openNewEvent" aria-label="Add event">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round" />
              <line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round" />
            </svg>
          </button>
        </div>

        <div v-if="selectedDayEvents.length === 0" class="no-events">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" stroke-linecap="round" />
            <line x1="8" y1="2" x2="8" y2="6" stroke-linecap="round" />
            <line x1="3" y1="10" x2="21" y2="10" stroke-linecap="round" />
          </svg>
          <span>{{ t('calendar.noEvents') }}</span>
        </div>

        <div v-else class="event-list">
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
                {{ formatEventTime(event.startTime) }}{{ event.endTime ? ` – ${formatEventTime(event.endTime)}` : '' }}
              </span>
              <span v-if="event.notes" class="event-notes">{{ event.notes }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Event Modal -->
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal">
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
            <input
              v-model="eventTitle"
              type="text"
              class="modal-input title-input"
              :placeholder="t('calendar.titlePlaceholder')"
            />

            <div class="modal-row">
              <span class="modal-label">{{ t('calendar.startTime') }}</span>
              <input v-model="eventStartTime" type="time" class="modal-input time-input" />
            </div>

            <div class="modal-row">
              <span class="modal-label">{{ t('calendar.endTime') }}</span>
              <input v-model="eventEndTime" type="time" class="modal-input time-input" />
            </div>

            <div class="modal-row">
              <span class="modal-label">{{ t('calendar.color') }}</span>
              <div class="color-picker">
                <button
                  v-for="color in EVENT_COLORS"
                  :key="color"
                  class="color-dot"
                  :class="{ active: eventColor === color }"
                  :style="{ background: color }"
                  @click="eventColor = color"
                />
              </div>
            </div>

            <textarea
              v-model="eventNotes"
              class="modal-input notes-input"
              :placeholder="t('calendar.notesPlaceholder')"
              rows="3"
            ></textarea>

            <button v-if="editingEvent" class="delete-event-btn" @click="handleDeleteEvent">
              {{ t('calendar.deleteEvent') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
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
  background: var(--color-bg);
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
  background: var(--color-bg);
  padding: calc(env(safe-area-inset-top, 12px) + 8px) 16px 0;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
}

.back-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: none;
  border: none;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.back-btn:active {
  background: var(--color-border);
}

.back-btn svg {
  width: 22px;
  height: 22px;
}

.header-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: -0.3px;
}

.today-btn {
  font-size: 14px;
  font-weight: 600;
  color: #007aff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
}

.today-btn:active {
  opacity: 0.5;
}

/* ─── Month Navigation ───────────────────────────────────────── */
.month-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px 8px;
}

.nav-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: none;
  border: none;
  color: #007aff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.nav-btn:active {
  background: rgba(0, 122, 255, 0.1);
}

.nav-btn svg {
  width: 18px;
  height: 18px;
}

.month-label {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
}

/* ─── Weekday Row ────────────────────────────────────────────── */
.weekday-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.weekday {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ─── Calendar Grid ──────────────────────────────────────────── */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 4px 8px;
  flex-shrink: 0;
}

.day-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 50%;
  position: relative;
  transition: background 0.15s ease;
}

.day-cell:active {
  background: rgba(0, 0, 0, 0.04);
}

.day-number {
  font-size: 15px;
  font-weight: 400;
  color: var(--color-text);
  line-height: 1;
}

.day-cell.other-month .day-number {
  color: var(--color-text-muted);
}

.day-cell.is-today {
  background: rgba(0, 122, 255, 0.08);
}

.day-cell.is-today .day-number {
  color: #007aff;
  font-weight: 700;
}

.day-cell.is-selected {
  background: #007aff;
}

.day-cell.is-selected .day-number {
  color: #fff;
  font-weight: 600;
}

.day-cell.is-selected.other-month .day-number {
  color: rgba(255, 255, 255, 0.7);
}

.event-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.day-cell.is-selected .event-dot {
  background: #fff !important;
}

/* ─── Day Events ─────────────────────────────────────────────── */
.day-events {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px 16px;
}

.day-events-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 8px;
  position: sticky;
  top: 0;
  background: var(--color-bg);
  z-index: 2;
}

.day-events-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.add-event-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #007aff;
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
}

.add-event-btn:active {
  transform: scale(0.9);
  background: #0066d6;
}

.add-event-btn svg {
  width: 18px;
  height: 18px;
}

/* ─── Empty State ────────────────────────────────────────────── */
.no-events {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 0;
  color: var(--color-text-muted);
}

.no-events svg {
  width: 40px;
  height: 40px;
  opacity: 0.5;
}

.no-events span {
  font-size: 14px;
}

/* ─── Event List ─────────────────────────────────────────────── */
.event-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-item {
  display: flex;
  align-items: stretch;
  gap: 12px;
  background: white;
  border-radius: 10px;
  padding: 12px;
  cursor: pointer;
  border: none;
  text-align: left;
  width: 100%;
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02);
  transition: all 0.15s ease;
}

.event-item:active {
  transform: scale(0.98);
  background: #f8f8f8;
}

.event-color-bar {
  width: 4px;
  border-radius: 2px;
  flex-shrink: 0;
}

.event-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.event-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.event-time {
  font-size: 13px;
  color: var(--color-text-secondary);
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
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.modal {
  width: 100%;
  max-width: 500px;
  background: var(--color-bg);
  border-radius: 16px 16px 0 0;
  max-height: 85vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  background: var(--color-bg);
  z-index: 2;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  border: none;
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.modal-close svg {
  width: 16px;
  height: 16px;
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
}

.modal-save {
  font-size: 16px;
  font-weight: 600;
  color: #007aff;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
}

.modal-save:disabled {
  color: var(--color-text-muted);
  cursor: default;
}

.modal-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-input {
  width: 100%;
  font-size: 16px;
  font-family: inherit;
  color: var(--color-text);
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 12px;
  outline: none;
  transition: border-color 0.15s ease;
}

.modal-input:focus {
  border-color: #007aff;
}

.modal-input::placeholder {
  color: var(--color-text-muted);
}

.title-input {
  font-size: 18px;
  font-weight: 600;
  border: none;
  border-bottom: 1px solid var(--color-border);
  border-radius: 0;
  padding: 8px 0;
  background: transparent;
}

.title-input:focus {
  border-color: #007aff;
}

.modal-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
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
}

.time-input:focus {
  border: none;
}

.color-picker {
  display: flex;
  gap: 8px;
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
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
  min-height: 80px;
  font-size: 15px;
}

.delete-event-btn {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 500;
  color: #ff3b30;
  background: none;
  border: none;
  border-top: 1px solid var(--color-border);
  cursor: pointer;
  margin-top: 8px;
  transition: opacity 0.15s ease;
}

.delete-event-btn:active {
  opacity: 0.5;
}

/* ─── Modal Transition ───────────────────────────────────────── */
.modal-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-leave-active {
  transition: all 0.2s ease-in;
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
  .calendar-grid {
    padding: 8px 16px;
  }

  .day-number {
    font-size: 17px;
  }

  .header-title {
    font-size: 24px;
  }
}
</style>
