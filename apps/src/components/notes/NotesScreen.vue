<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSwipeGestures, useNotesStore, type Note } from 'micronet-kernel'
import { useNavigation } from '../../kernel'

const { t } = useI18n()
const { goBack, goHome } = useNavigation()

const { targetRef, isDragging } = useSwipeGestures({
  onSwipeUp: () => goHome(),
  onSwipeRight: () => goBack(),
})

const {
  addNote, updateNote, deleteNote, togglePin,
  searchNotes, getPinnedNotes, getUnpinnedNotes, notes,
} = useNotesStore()

// ─── State ──────────────────────────────────────────────────────
const showSearch = ref(false)
const searchQuery = ref('')
const showEditor = ref(false)
const editingNote = ref<Note | null>(null)

const noteTitle = ref('')
const noteContent = ref('')
const noteColor = ref('#ffffff')
const notePinned = ref(false)

const NOTE_COLORS = [
  { value: '#ffffff', name: 'White' },
  { value: '#fff9c4', name: 'Light Yellow' },
  { value: '#ffe0b2', name: 'Light Orange' },
  { value: '#ffcdd2', name: 'Light Red' },
  { value: '#e1bee7', name: 'Light Purple' },
  { value: '#bbdefb', name: 'Light Blue' },
  { value: '#c8e6c9', name: 'Light Green' },
  { value: '#f5f5f5', name: 'Light Gray' },
]

const titleInputRef = ref<HTMLInputElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)

// ─── Computed ───────────────────────────────────────────────────
const filteredNotes = computed(() => {
  if (searchQuery.value.trim()) {
    return searchNotes(searchQuery.value)
  }
  return []
})

const pinnedNotes = computed(() => {
  if (searchQuery.value.trim()) {
    return filteredNotes.value.filter((n: Note) => n.pinned)
  }
  return getPinnedNotes()
})

const unpinnedNotes = computed(() => {
  if (searchQuery.value.trim()) {
    return filteredNotes.value.filter((n: Note) => !n.pinned)
  }
  return getUnpinnedNotes()
})

const noteCount = computed(() => notes.value.length)

// ─── Relative Time ──────────────────────────────────────────────
function relativeTime(isoDate: string): string {
  const now = Date.now()
  const then = new Date(isoDate).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return t('notes.justNow')
  if (diffMin < 60) return t('notes.minutesAgo', { n: diffMin })
  if (diffHr < 24) return t('notes.hoursAgo', { n: diffHr })
  if (diffDay === 1) return t('notes.yesterday')
  if (diffDay < 30) return t('notes.daysAgo', { n: diffDay })

  const d = new Date(isoDate)
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

function previewText(content: string): string {
  if (!content) return ''
  const lines = content.split('\n').filter(l => l.trim())
  return lines.slice(0, 2).join(' ').slice(0, 120)
}

// ─── Search ─────────────────────────────────────────────────────
function toggleSearch() {
  showSearch.value = !showSearch.value
  if (!showSearch.value) {
    searchQuery.value = ''
  } else {
    nextTick(() => searchInputRef.value?.focus())
  }
}

// ─── Editor ─────────────────────────────────────────────────────
function openNewNote() {
  editingNote.value = null
  noteTitle.value = ''
  noteContent.value = ''
  noteColor.value = '#ffffff'
  notePinned.value = false
  showEditor.value = true
  nextTick(() => titleInputRef.value?.focus())
}

function openEditNote(note: Note) {
  editingNote.value = note
  noteTitle.value = note.title
  noteContent.value = note.content
  noteColor.value = note.color
  notePinned.value = note.pinned
  showEditor.value = true
  nextTick(() => titleInputRef.value?.focus())
}

function closeEditor() {
  showEditor.value = false
  editingNote.value = null
}

function saveNote() {
  if (!noteTitle.value.trim() && !noteContent.value.trim()) return

  const title = noteTitle.value.trim() || noteContent.value.trim().split('\n')[0].slice(0, 50)
  const content = noteContent.value.trim()

  if (editingNote.value) {
    updateNote(editingNote.value.id, {
      title,
      content,
      color: noteColor.value,
      pinned: notePinned.value,
    })
  } else {
    addNote({
      title,
      content,
      color: noteColor.value,
      pinned: notePinned.value,
    })
  }
  closeEditor()
}

function handleDeleteNote() {
  if (editingNote.value) {
    deleteNote(editingNote.value.id)
    closeEditor()
  }
}

function handleTogglePin() {
  notePinned.value = !notePinned.value
}

watch(showEditor, (val) => {
  if (!val) return
  nextTick(() => {
    const ta = document.querySelector('.editor-content') as HTMLTextAreaElement
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = ta.scrollHeight + 'px'
    }
  })
})

function autoResize(e: Event) {
  const ta = e.target as HTMLTextAreaElement
  ta.style.height = 'auto'
  ta.style.height = ta.scrollHeight + 'px'
}
</script>

<template>
  <div :ref="targetRef" class="notes-screen" :class="{ dragging: isDragging }">
    <div class="wallpaper"></div>
    <div class="content">
      <!-- Header -->
      <div class="header">
        <div class="header-top">
          <div class="header-left">
            <h1 class="header-title">{{ t('notes.title') }}</h1>
            <span v-if="noteCount > 0" class="note-count">{{ noteCount }}</span>
          </div>
          <div class="header-actions">
            <button class="icon-btn" :class="{ active: showSearch }" @click="toggleSearch" aria-label="Search">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Search Bar -->
        <Transition name="search-slide">
          <div v-if="showSearch" class="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" stroke-linecap="round" />
            </svg>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="search-input"
              :placeholder="t('notes.search')"
            />
            <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
                <path d="M15 9l-6 6M9 9l6 6" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </Transition>
      </div>

      <!-- Notes List -->
      <div class="notes-list">
        <Transition name="fade" mode="out-in">
          <div v-if="notes.length === 0" key="empty" class="empty-state">
            <div class="empty-illustration">
              <svg viewBox="0 0 64 64" fill="none">
                <rect x="12" y="8" width="40" height="48" rx="4" stroke="currentColor" stroke-width="1.5" />
                <line x1="20" y1="20" x2="44" y2="20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <line x1="20" y1="28" x2="44" y2="28" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <line x1="20" y1="36" x2="36" y2="36" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <circle cx="44" cy="48" r="10" fill="currentColor" opacity="0.06" />
                <path d="M42 46l4 4M46 46l-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </div>
            <span class="empty-title">{{ t('notes.noNotes') }}</span>
            <span class="empty-desc">{{ t('notes.noNotesDesc') }}</span>
          </div>

          <div v-else-if="searchQuery && filteredNotes.length === 0" key="no-results" class="empty-state">
            <div class="empty-illustration">
              <svg viewBox="0 0 64 64" fill="none">
                <circle cx="28" cy="28" r="18" stroke="currentColor" stroke-width="1.5" />
                <line x1="41" y1="41" x2="54" y2="54" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <path d="M22 28h12M28 22v12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" opacity="0.3" />
              </svg>
            </div>
            <span class="empty-title">{{ t('notes.noResults') }}</span>
            <span class="empty-desc">{{ t('notes.noResultsDesc') }}</span>
          </div>

          <div v-else key="list" class="notes-content">
            <!-- Pinned Section -->
            <div v-if="pinnedNotes.length > 0" class="section">
              <div class="section-header">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" class="pin-icon">
                  <path d="M10.5 2.5l3 3-5 5-3-3 5-5z" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M7.5 7.5l-5 5M11 6l2.5 2.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span class="section-label">{{ t('notes.pinned') }}</span>
              </div>
              <div class="notes-grid">
                <button
                  v-for="note in pinnedNotes"
                  :key="note.id"
                  class="note-card"
                  :style="{ background: note.color === '#ffffff' ? 'var(--color-bg)' : note.color }"
                  @click="openEditNote(note)"
                >
                  <div class="note-card-header">
                    <span class="note-title">{{ note.title }}</span>
                    <button class="pin-badge" @click.stop="togglePin(note.id)" aria-label="Unpin">
                      <svg viewBox="0 0 16 16" fill="currentColor" stroke="none">
                        <path d="M10.5 2.5l3 3-5 5-3-3 5-5z" />
                        <path d="M7.5 7.5l-5 5M11 6l2.5 2.5" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round" />
                      </svg>
                    </button>
                  </div>
                  <p v-if="previewText(note.content)" class="note-preview">{{ previewText(note.content) }}</p>
                  <span class="note-time">{{ relativeTime(note.updatedAt) }}</span>
                </button>
              </div>
            </div>

            <!-- Regular Notes -->
            <div v-if="unpinnedNotes.length > 0" class="section">
              <div v-if="pinnedNotes.length > 0" class="section-header">
                <span class="section-label" style="opacity: 0; user-select: none">.</span>
              </div>
              <div class="notes-grid">
                <button
                  v-for="note in unpinnedNotes"
                  :key="note.id"
                  class="note-card"
                  :style="{ background: note.color === '#ffffff' ? 'var(--color-bg)' : note.color }"
                  @click="openEditNote(note)"
                >
                  <div class="note-card-header">
                    <span class="note-title">{{ note.title }}</span>
                    <button class="pin-btn" @click.stop="togglePin(note.id)" aria-label="Pin">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.2">
                        <path d="M10.5 2.5l3 3-5 5-3-3 5-5z" stroke-linecap="round" stroke-linejoin="round" />
                        <path d="M7.5 7.5l-5 5M11 6l2.5 2.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <p v-if="previewText(note.content)" class="note-preview">{{ previewText(note.content) }}</p>
                  <span class="note-time">{{ relativeTime(note.updatedAt) }}</span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Bottom Actions -->
      <div class="bottom-bar">
        <button class="add-btn" @click="openNewNote" aria-label="New note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19" stroke-linecap="round" />
            <line x1="5" y1="12" x2="19" y2="12" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Editor Modal -->
    <Transition name="modal">
      <div v-if="showEditor" class="modal-overlay" @click.self="closeEditor">
        <div class="modal">
          <div class="modal-handle"></div>
          <div class="modal-header">
            <button class="modal-close" @click="closeEditor">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
              </svg>
            </button>
            <span class="modal-title">{{ editingNote ? t('notes.editNote') : t('notes.newNote') }}</span>
            <button class="modal-save" :disabled="!noteTitle.trim() && !noteContent.trim()" @click="saveNote">
              {{ t('notes.save') }}
            </button>
          </div>

          <div class="modal-body">
            <input
              ref="titleInputRef"
              v-model="noteTitle"
              type="text"
              class="editor-title"
              :placeholder="t('notes.titlePlaceholder')"
            />
            <textarea
              v-model="noteContent"
              class="editor-content"
              :placeholder="t('notes.contentPlaceholder')"
              @input="autoResize"
            ></textarea>

            <div class="editor-toolbar">
              <div class="toolbar-section">
                <span class="toolbar-label">{{ t('notes.color') }}</span>
                <div class="color-picker">
                  <button
                    v-for="color in NOTE_COLORS"
                    :key="color.value"
                    class="color-dot"
                    :class="{ active: noteColor === color.value }"
                    :style="{ background: color.value }"
                    @click="noteColor = color.value"
                  >
                    <svg v-if="noteColor === color.value" viewBox="0 0 16 16" fill="none" stroke="#333" stroke-width="2.5">
                      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>

              <div class="toolbar-actions">
                <button
                  class="toolbar-btn"
                  :class="{ active: notePinned }"
                  @click="handleTogglePin"
                >
                  <svg viewBox="0 0 20 20" :fill="notePinned ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="1.5">
                    <path d="M12.5 3.5l4 4-6 6-4-4 6-6z" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M8.5 9.5l-6 6M13 8l3 3" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <span>{{ t('notes.pinned') }}</span>
                </button>
              </div>
            </div>

            <button v-if="editingNote" class="delete-note-btn" @click="handleDeleteNote">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5">
                <polyline points="3 5 5 5 17 5" stroke-linecap="round" />
                <path d="M15 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5m3 0V3.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5V5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ t('notes.deleteNote') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.notes-screen {
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
  margin-bottom: 4px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.header-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.5px;
}

.note-count {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-tertiary);
  background: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  padding: 2px 10px;
  line-height: 1.4;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.icon-btn {
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

.icon-btn:active {
  background: rgba(0, 0, 0, 0.05);
  transform: scale(0.92);
}

.icon-btn.active {
  color: var(--color-accent);
  background: var(--color-accent-soft);
}

.icon-btn svg {
  width: 20px;
  height: 20px;
}

/* ─── Search Bar ─────────────────────────────────────────────── */
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  padding: 10px 14px;
  margin: 12px 0 8px;
}

.search-icon {
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
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

.clear-btn {
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
  flex-shrink: 0;
  padding: 0;
}

.clear-btn svg {
  width: 18px;
  height: 18px;
}

.search-slide-enter-active {
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.search-slide-leave-active {
  transition: all 0.2s ease-in;
}

.search-slide-enter-from,
.search-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
  max-height: 0;
  margin: 0;
  padding: 0 14px;
}

/* ─── Notes List ─────────────────────────────────────────────── */
.notes-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px 20px 100px;
}

/* ─── Empty State ────────────────────────────────────────────── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 80px 20px;
  color: var(--color-text-muted);
}

.empty-illustration {
  width: 64px;
  height: 64px;
  opacity: 0.2;
}

.empty-illustration svg {
  width: 100%;
  height: 100%;
}

.empty-title {
  font-size: 17px;
  font-weight: 500;
  color: var(--color-text);
  opacity: 0.5;
}

.empty-desc {
  font-size: 14px;
  color: var(--color-text-tertiary);
  text-align: center;
  line-height: 1.4;
}

/* ─── Section ────────────────────────────────────────────────── */
.section {
  margin-bottom: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 0;
}

.section-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.pin-icon {
  width: 12px;
  height: 12px;
  color: var(--color-text-tertiary);
}

/* ─── Notes Grid ─────────────────────────────────────────────── */
.notes-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.note-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 14px;
  cursor: pointer;
  border: none;
  text-align: left;
  width: 100%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  position: relative;
}

.note-card:active {
  transform: scale(0.99);
  opacity: 0.9;
}

.note-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.note-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.2px;
  line-height: 1.3;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.note-preview {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0;
}

.note-time {
  font-size: 12px;
  color: var(--color-text-tertiary);
  letter-spacing: 0.2px;
}

.pin-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  border: none;
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.pin-badge:active {
  transform: scale(0.85);
}

.pin-badge svg {
  width: 12px;
  height: 12px;
}

.pin-btn {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0;
  transition: all 0.15s ease;
}

.note-card:hover .pin-btn {
  opacity: 1;
}

.pin-btn:active {
  transform: scale(0.85);
}

.pin-btn svg {
  width: 12px;
  height: 12px;
}

/* ─── Bottom Bar ─────────────────────────────────────────────── */
.bottom-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 16px 20px calc(env(safe-area-inset-bottom, 12px) + 8px);
  background: linear-gradient(transparent, var(--color-bg-warm-to) 30%);
  z-index: 5;
}

.add-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-text);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.add-btn:active {
  transform: scale(0.88);
  background: #333;
}

.add-btn svg {
  width: 22px;
  height: 22px;
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
  max-height: 90vh;
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
  font-weight: 600;
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
  padding: 0 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor-title {
  font-size: 22px;
  font-weight: 600;
  font-family: inherit;
  color: var(--color-text);
  border: none;
  background: none;
  outline: none;
  padding: 8px 0;
  letter-spacing: -0.3px;
}

.editor-title::placeholder {
  color: var(--color-text-muted);
}

.editor-content {
  font-size: 15px;
  font-family: inherit;
  color: var(--color-text);
  border: none;
  background: none;
  outline: none;
  resize: none;
  min-height: 120px;
  line-height: 1.6;
  padding: 0;
}

.editor-content::placeholder {
  color: var(--color-text-muted);
}

/* ─── Editor Toolbar ─────────────────────────────────────────── */
.editor-toolbar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
  border-top: 0.5px solid var(--color-border);
}

.toolbar-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toolbar-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
}

.color-picker {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.color-dot {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.04);
  border: none;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolbar-btn:active {
  transform: scale(0.97);
}

.toolbar-btn.active {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.toolbar-btn svg {
  width: 16px;
  height: 16px;
}

/* ─── Delete Button ──────────────────────────────────────────── */
.delete-note-btn {
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

.delete-note-btn svg {
  width: 16px;
  height: 16px;
}

.delete-note-btn:active {
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
  .header-title {
    font-size: 36px;
  }

  .note-card {
    padding: 18px;
  }

  .notes-grid {
    gap: 12px;
  }
}
</style>
