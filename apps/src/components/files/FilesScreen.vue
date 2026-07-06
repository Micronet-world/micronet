<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSwipeGestures, useFileStore } from '@micronet/kernel'
import type { FileItem } from '@micronet/kernel'
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

const {
  addFolder, addFile, updateFile, deleteItem, deleteItems,
  getItemById, getBreadcrumb, searchFiles,
  getSortedChildren, formatFileSize,
} = useFileStore()

// ─── Navigation State ───────────────────────────────────────────
const currentFolderId = ref<string | null>(null)
const viewMode = ref<'list' | 'grid'>('list')
const sortBy = ref<'name' | 'date' | 'size'>('name')
const sortAscending = ref(true)
const searchQuery = ref('')
const isSearching = ref(false)

// ─── Selection State ────────────────────────────────────────────
const isSelecting = ref(false)
const selectedIds = ref<Set<string>>(new Set())

// ─── Modal State ────────────────────────────────────────────────
const showCreateModal = ref(false)
const createType = ref<'file' | 'folder'>('folder')
const createName = ref('')
const showRenameModal = ref(false)
const renameTarget = ref<FileItem | null>(null)
const renameName = ref('')
const showDeleteModal = ref(false)
const deleteTargetIds = ref<string[]>([])
const showInfoModal = ref(false)
const infoTarget = ref<FileItem | null>(null)
const showFileEditor = ref(false)
const editingFile = ref<FileItem | null>(null)
const editContent = ref('')
const showSortMenu = ref(false)

// ─── Computed ───────────────────────────────────────────────────
const breadcrumb = computed(() => getBreadcrumb(currentFolderId.value))

const displayedItems = computed(() => {
  if (searchQuery.value.trim()) {
    return searchFiles(searchQuery.value, currentFolderId.value)
  }
  return getSortedChildren(currentFolderId.value, sortBy.value, sortAscending.value)
})

const currentFolderName = computed(() => {
  if (!currentFolderId.value) return t('files.root')
  const item = getItemById(currentFolderId.value)
  return item ? item.name : t('files.root')
})

const selectedCount = computed(() => selectedIds.value.size)

const hasSelection = computed(() => selectedIds.value.size > 0)

const allSelected = computed(() => {
  if (displayedItems.value.length === 0) return false
  return displayedItems.value.every(item => selectedIds.value.has(item.id))
})

// ─── Navigation ─────────────────────────────────────────────────
function openFolder(id: string) {
  currentFolderId.value = id
  searchQuery.value = ''
  isSearching.value = false
  clearSelection()
}

function navigateToBreadcrumb(id: string | null) {
  currentFolderId.value = id
  searchQuery.value = ''
  isSearching.value = false
  clearSelection()
}

// ─── Selection ──────────────────────────────────────────────────
function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  selectedIds.value = new Set(selectedIds.value)
}

function toggleSelectAll() {
  if (allSelected.value) {
    clearSelection()
  } else {
    selectedIds.value = new Set(displayedItems.value.map(i => i.id))
  }
}

function clearSelection() {
  selectedIds.value = new Set()
  isSelecting.value = false
}

function startSelecting(id?: string) {
  isSelecting.value = true
  if (id) {
    selectedIds.value = new Set([id])
  }
}

// ─── Create ─────────────────────────────────────────────────────
function openCreateModal(type: 'file' | 'folder') {
  createType.value = type
  createName.value = ''
  showCreateModal.value = true
}

function confirmCreate() {
  const name = createName.value.trim()
  if (!name) return
  if (createType.value === 'folder') {
    addFolder(name, currentFolderId.value)
  } else {
    addFile(name, currentFolderId.value)
  }
  showCreateModal.value = false
}

// ─── Rename ─────────────────────────────────────────────────────
function openRenameModal(item: FileItem) {
  renameTarget.value = item
  renameName.value = item.name
  showRenameModal.value = true
}

function confirmRename() {
  if (!renameTarget.value) return
  const name = renameName.value.trim()
  if (!name) return
  updateFile(renameTarget.value.id, { name })
  showRenameModal.value = false
}

// ─── Delete ─────────────────────────────────────────────────────
function confirmDeleteItem(item: FileItem) {
  deleteTargetIds.value = [item.id]
  showDeleteModal.value = true
}

function confirmDeleteSelected() {
  deleteTargetIds.value = [...selectedIds.value]
  showDeleteModal.value = true
}

function executeDelete() {
  if (deleteTargetIds.value.length === 1) {
    deleteItem(deleteTargetIds.value[0])
  } else {
    deleteItems(deleteTargetIds.value)
  }
  showDeleteModal.value = false
  clearSelection()
}

// ─── Info ───────────────────────────────────────────────────────
function openInfo(item: FileItem) {
  infoTarget.value = item
  showInfoModal.value = true
}

// ─── File Editor ────────────────────────────────────────────────
function openFileEditor(item: FileItem) {
  editingFile.value = item
  editContent.value = item.content
  showFileEditor.value = true
}

function saveFileContent() {
  if (!editingFile.value) return
  updateFile(editingFile.value.id, { content: editContent.value })
  showFileEditor.value = false
}

// ─── Sort ───────────────────────────────────────────────────────
function setSortBy(field: 'name' | 'date' | 'size') {
  if (sortBy.value === field) {
    sortAscending.value = !sortAscending.value
  } else {
    sortBy.value = field
    sortAscending.value = true
  }
  showSortMenu.value = false
}

// ─── Actions ────────────────────────────────────────────────────
function handleItemTap(item: FileItem) {
  if (isSelecting.value) {
    toggleSelect(item.id)
    return
  }
  if (item.type === 'folder') {
    openFolder(item.id)
  } else {
    openFileEditor(item)
  }
}

function handleItemLongPress(item: FileItem) {
  if (!isSelecting.value) {
    startSelecting(item.id)
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) {
    const hours = Math.floor(diff / 3600000)
    if (hours === 0) return t('notes.justNow')
    return t('notes.hoursAgo', { n: hours })
  }
  if (days === 1) return t('notes.yesterday')
  if (days < 7) return t('notes.daysAgo', { n: days })
  return d.toLocaleDateString()
}

function getFileIcon(item: FileItem): string {
  if (item.type === 'folder') return 'folder'
  const ext = item.name.split('.').pop()?.toLowerCase() || ''
  if (['txt', 'md', 'doc', 'docx'].includes(ext)) return 'doc'
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) return 'image'
  if (['mp3', 'wav', 'ogg', 'aac'].includes(ext)) return 'audio'
  if (['mp4', 'webm', 'mov'].includes(ext)) return 'video'
  if (['pdf'].includes(ext)) return 'pdf'
  if (['zip', 'rar', '7z', 'tar'].includes(ext)) return 'archive'
  if (['js', 'ts', 'py', 'html', 'css', 'json'].includes(ext)) return 'code'
  return 'file'
}

let longPressTimer: ReturnType<typeof setTimeout> | null = null
let longPressItem: FileItem | null = null

function onPointerDown(item: FileItem) {
  longPressItem = item
  longPressTimer = setTimeout(() => {
    handleItemLongPress(item)
    longPressItem = null
  }, 500)
}

function onPointerUp() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function onPointerCancel() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  longPressItem = null
}

function onClickItem(item: FileItem) {
  if (longPressItem === item) {
    longPressItem = null
  }
  handleItemTap(item)
}

watch(searchQuery, (val) => {
  if (val.trim()) {
    isSearching.value = true
  }
})
</script>

<template>
  <div :ref="targetRef" class="files-screen" :class="{ dragging: isDragging }">
    <div class="wallpaper"></div>
    <div class="content">
      <!-- Header -->
      <div class="header">
        <div class="header-top">
          <div class="header-left">
            <button v-if="isSelecting" class="header-btn" @click="clearSelection">
              {{ t('files.done') }}
            </button>
            <button v-else-if="currentFolderId" class="header-btn back-btn" @click="navigateToBreadcrumb(breadcrumb.length > 1 ? breadcrumb[breadcrumb.length - 2].id : null)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <h1 class="header-title">{{ isSelecting ? t('files.selected', { count: selectedCount }) : currentFolderName }}</h1>
          <div class="header-right">
            <button v-if="isSelecting" class="header-btn" @click="toggleSelectAll">
              {{ allSelected ? t('files.deselect') : t('files.selectAll') }}
            </button>
            <template v-else>
              <button class="header-btn icon-btn" @click="isSearching = !isSearching; if (!isSearching) searchQuery = ''">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" stroke-linecap="round" />
                </svg>
              </button>
              <button class="header-btn icon-btn" @click="showSortMenu = !showSortMenu">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M3 12h12M3 18h6" stroke-linecap="round" />
                </svg>
              </button>
            </template>
          </div>
        </div>

        <!-- Breadcrumb -->
        <div v-if="!isSearching && !isSelecting" class="breadcrumb">
          <button class="crumb" :class="{ active: !currentFolderId }" @click="navigateToBreadcrumb(null)">
            {{ t('files.root') }}
          </button>
          <template v-for="(crumb, i) in breadcrumb" :key="crumb.id">
            <span class="crumb-sep">/</span>
            <button class="crumb" :class="{ active: i === breadcrumb.length - 1 }" @click="navigateToBreadcrumb(crumb.id)">
              {{ crumb.name }}
            </button>
          </template>
        </div>

        <!-- Search Bar -->
        <Transition name="fade">
          <div v-if="isSearching" class="search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" stroke-linecap="round" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              :placeholder="t('common.search')"
              autofocus
            />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" stroke-linecap="round" />
                <line x1="9" y1="9" x2="15" y2="15" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </Transition>

        <!-- Sort Menu -->
        <Transition name="fade">
          <div v-if="showSortMenu" class="sort-menu">
            <button class="sort-option" :class="{ active: sortBy === 'name' }" @click="setSortBy('name')">
              <span>{{ t('files.sortName') }}</span>
              <svg v-if="sortBy === 'name'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path :d="sortAscending ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button class="sort-option" :class="{ active: sortBy === 'date' }" @click="setSortBy('date')">
              <span>{{ t('files.sortDate') }}</span>
              <svg v-if="sortBy === 'date'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path :d="sortAscending ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <button class="sort-option" :class="{ active: sortBy === 'size' }" @click="setSortBy('size')">
              <span>{{ t('files.sortSize') }}</span>
              <svg v-if="sortBy === 'size'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path :d="sortAscending ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <div class="sort-divider"></div>
            <button class="sort-option" @click="viewMode = viewMode === 'list' ? 'grid' : 'list'; showSortMenu = false">
              <span>{{ viewMode === 'list' ? t('files.gridView') : t('files.listView') }}</span>
            </button>
          </div>
        </Transition>
      </div>

      <!-- File List -->
      <div class="file-list" @click="showSortMenu = false">
        <Transition name="fade" mode="out-in">
          <div v-if="displayedItems.length === 0" key="empty" class="empty-state">
            <div class="empty-icon">
              <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M6 10a2 2 0 0 1 2-2h10l4 4h16a2 2 0 0 1 2 2v24a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10z" />
              </svg>
            </div>
            <span class="empty-text">{{ searchQuery ? t('files.noResults') : t('files.emptyFolder') }}</span>
            <span class="empty-desc">{{ searchQuery ? t('files.noResultsDesc') : t('files.emptyFolderDesc') }}</span>
          </div>

          <div v-else-if="viewMode === 'list'" key="list" class="list-view">
            <div
              v-for="item in displayedItems"
              :key="item.id"
              class="list-item"
              :class="{ selected: selectedIds.has(item.id), 'in-selection': isSelecting }"
              @pointerdown="onPointerDown(item)"
              @pointerup="onPointerUp"
              @pointercancel="onPointerCancel"
              @pointerleave="onPointerCancel"
              @click="onClickItem(item)"
            >
              <button v-if="isSelecting" class="select-check" @click.stop="toggleSelect(item.id)">
                <div class="check-circle" :class="{ checked: selectedIds.has(item.id) }">
                  <svg v-if="selectedIds.has(item.id)" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                    <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </button>
              <div class="item-icon" :class="getFileIcon(item)">
                <template v-if="item.type === 'folder'">
                  <svg viewBox="0 0 24 24" fill="none" :stroke="item.color || 'currentColor'" stroke-width="1.5">
                    <path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
                  </svg>
                </template>
                <template v-else>
                  <svg v-if="getFileIcon(item) === 'doc'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke-linecap="round" stroke-linejoin="round" />
                    <polyline points="14 2 14 8 20 8" stroke-linecap="round" stroke-linejoin="round" />
                    <line x1="8" y1="13" x2="16" y2="13" stroke-linecap="round" />
                    <line x1="8" y1="17" x2="16" y2="17" stroke-linecap="round" />
                  </svg>
                  <svg v-else-if="getFileIcon(item) === 'image'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <svg v-else-if="getFileIcon(item) === 'audio'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 18V5l12-2v13" stroke-linecap="round" stroke-linejoin="round" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                  <svg v-else-if="getFileIcon(item) === 'video'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
                  </svg>
                  <svg v-else-if="getFileIcon(item) === 'pdf'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke-linecap="round" stroke-linejoin="round" />
                    <polyline points="14 2 14 8 20 8" stroke-linecap="round" stroke-linejoin="round" />
                    <text x="8" y="17" font-size="6" font-weight="600" fill="currentColor" stroke="none">PDF</text>
                  </svg>
                  <svg v-else-if="getFileIcon(item) === 'archive'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 8v13H3V8" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M1 3h22v5H1z" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M10 12h4" stroke-linecap="round" />
                  </svg>
                  <svg v-else-if="getFileIcon(item) === 'code'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <polyline points="16 18 22 12 16 6" stroke-linecap="round" stroke-linejoin="round" />
                    <polyline points="8 6 2 12 8 18" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke-linecap="round" stroke-linejoin="round" />
                    <polyline points="14 2 14 8 20 8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </template>
              </div>
              <div class="item-info">
                <span class="item-name">{{ item.name }}</span>
                <span class="item-meta">
                  {{ item.type === 'folder' ? t('files.folder') : formatFileSize(item.size) }}
                  <span class="meta-sep">·</span>
                  {{ formatDate(item.updatedAt) }}
                </span>
              </div>
              <button v-if="!isSelecting" class="item-actions" @click.stop="openInfo(item)">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>
            </div>
          </div>

          <div v-else key="grid" class="grid-view">
            <div
              v-for="item in displayedItems"
              :key="item.id"
              class="grid-item"
              :class="{ selected: selectedIds.has(item.id), 'in-selection': isSelecting }"
              @pointerdown="onPointerDown(item)"
              @pointerup="onPointerUp"
              @pointercancel="onPointerCancel"
              @pointerleave="onPointerCancel"
              @click="onClickItem(item)"
            >
              <button v-if="isSelecting" class="select-check grid-check" @click.stop="toggleSelect(item.id)">
                <div class="check-circle" :class="{ checked: selectedIds.has(item.id) }">
                  <svg v-if="selectedIds.has(item.id)" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                    <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
              </button>
              <div class="grid-icon" :class="getFileIcon(item)">
                <template v-if="item.type === 'folder'">
                  <svg viewBox="0 0 24 24" fill="none" :stroke="item.color || 'currentColor'" stroke-width="1.5">
                    <path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
                  </svg>
                </template>
                <template v-else>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke-linecap="round" stroke-linejoin="round" />
                    <polyline points="14 2 14 8 20 8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </template>
              </div>
              <span class="grid-name">{{ item.name }}</span>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Bottom Action Bar -->
      <div class="bottom-bar">
        <template v-if="isSelecting">
          <button class="bar-btn" :disabled="!hasSelection" @click="confirmDeleteSelected">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 5 5 5 17 5" stroke-linecap="round" />
              <path d="M15 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5m3 0V3.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5V5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </template>
        <template v-else>
          <button class="bar-btn" @click="openCreateModal('folder')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
              <line x1="12" y1="11" x2="12" y2="17" stroke-linecap="round" />
              <line x1="9" y1="14" x2="15" y2="14" stroke-linecap="round" />
            </svg>
          </button>
          <button class="bar-btn" @click="openCreateModal('file')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke-linecap="round" stroke-linejoin="round" />
              <polyline points="14 2 14 8 20 8" stroke-linecap="round" stroke-linejoin="round" />
              <line x1="12" y1="11" x2="12" y2="17" stroke-linecap="round" />
              <line x1="9" y1="14" x2="15" y2="14" stroke-linecap="round" />
            </svg>
          </button>
        </template>
      </div>

      <!-- Create Modal -->
      <Transition name="modal">
        <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
          <div class="modal">
            <div class="modal-handle"></div>
            <div class="modal-header">
              <button class="modal-close" @click="showCreateModal = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
                </svg>
              </button>
              <span class="modal-title">{{ createType === 'folder' ? t('files.newFolder') : t('files.newFile') }}</span>
              <button class="modal-save" :disabled="!createName.trim()" @click="confirmCreate">{{ t('files.save') }}</button>
            </div>
            <div class="modal-body">
              <input
                v-model="createName"
                type="text"
                class="modal-input"
                :placeholder="createType === 'folder' ? t('files.folderName') : t('files.fileName')"
                autofocus
              />
            </div>
          </div>
        </div>
      </Transition>

      <!-- Rename Modal -->
      <Transition name="modal">
        <div v-if="showRenameModal" class="modal-overlay" @click.self="showRenameModal = false">
          <div class="modal">
            <div class="modal-handle"></div>
            <div class="modal-header">
              <button class="modal-close" @click="showRenameModal = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
                </svg>
              </button>
              <span class="modal-title">{{ t('files.rename') }}</span>
              <button class="modal-save" :disabled="!renameName.trim()" @click="confirmRename">{{ t('files.save') }}</button>
            </div>
            <div class="modal-body">
              <input
                v-model="renameName"
                type="text"
                class="modal-input"
                :placeholder="t('files.name')"
                autofocus
              />
            </div>
          </div>
        </div>
      </Transition>

      <!-- Delete Modal -->
      <Transition name="modal">
        <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
          <div class="modal">
            <div class="modal-handle"></div>
            <div class="modal-header">
              <span class="modal-title">{{ t('files.deleteItem') }}</span>
            </div>
            <div class="modal-body center-text">
              <p class="delete-text">
                {{ deleteTargetIds.length > 1 ? t('files.deleteItemsConfirm', { count: deleteTargetIds.length }) : t('files.deleteConfirm') }}
              </p>
              <div class="modal-actions">
                <button class="modal-action-btn cancel" @click="showDeleteModal = false">{{ t('files.cancel') }}</button>
                <button class="modal-action-btn danger" @click="executeDelete">{{ t('files.deleteItem') }}</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- Info Modal -->
      <Transition name="modal">
        <div v-if="showInfoModal && infoTarget" class="modal-overlay" @click.self="showInfoModal = false">
          <div class="modal">
            <div class="modal-handle"></div>
            <div class="modal-header">
              <button class="modal-close" @click="showInfoModal = false">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" />
                </svg>
              </button>
              <span class="modal-title">{{ t('files.info') }}</span>
              <div style="width: 28px"></div>
            </div>
            <div class="modal-body">
              <div class="info-header">
                <div class="info-icon" :class="getFileIcon(infoTarget)">
                  <svg v-if="infoTarget.type === 'folder'" viewBox="0 0 24 24" fill="none" :stroke="infoTarget.color || 'currentColor'" stroke-width="1.5">
                    <path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke-linecap="round" stroke-linejoin="round" />
                    <polyline points="14 2 14 8 20 8" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </div>
                <span class="info-name">{{ infoTarget.name }}</span>
              </div>
              <div class="info-rows">
                <div class="info-row">
                  <span class="info-label">{{ t('files.type') }}</span>
                  <span class="info-value">{{ infoTarget.type === 'folder' ? t('files.folder') : t('files.file') }}</span>
                </div>
                <div v-if="infoTarget.type === 'file'" class="info-row">
                  <span class="info-label">{{ t('files.size') }}</span>
                  <span class="info-value">{{ formatFileSize(infoTarget.size) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">{{ t('files.created') }}</span>
                  <span class="info-value">{{ formatDate(infoTarget.createdAt) }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">{{ t('files.modified') }}</span>
                  <span class="info-value">{{ formatDate(infoTarget.updatedAt) }}</span>
                </div>
              </div>
              <div class="info-actions">
                <button class="info-action-btn" @click="showInfoModal = false; openRenameModal(infoTarget!)">
                  {{ t('files.rename') }}
                </button>
                <button class="info-action-btn danger" @click="showInfoModal = false; confirmDeleteItem(infoTarget!)">
                  {{ t('files.deleteItem') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <!-- File Editor -->
      <Transition name="slide-up">
        <div v-if="showFileEditor && editingFile" class="editor-screen">
          <div class="editor-header">
            <button class="header-btn" @click="showFileEditor = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
            <span class="editor-title">{{ editingFile.name }}</span>
            <button class="header-btn save-btn" @click="saveFileContent">{{ t('files.save') }}</button>
          </div>
          <textarea
            v-model="editContent"
            class="editor-textarea"
            :placeholder="t('files.textPlaceholder')"
            autofocus
          ></textarea>
        </div>
      </Transition>
    </div>

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
.files-screen {
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
  padding: calc(env(safe-area-inset-top, 12px) + 8px) 20px 0;
}

.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 70px;
}

.header-right {
  justify-content: flex-end;
}

.header-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
  letter-spacing: -0.2px;
  text-align: center;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-btn {
  min-width: 32px;
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
  padding: 0 8px;
}

.header-btn:active {
  opacity: 0.5;
}

.icon-btn {
  width: 32px;
  min-width: 32px;
  padding: 0;
}

.icon-btn svg {
  width: 18px;
  height: 18px;
}

.back-btn {
  padding: 0;
}

.back-btn svg {
  width: 20px;
  height: 20px;
}

.save-btn {
  font-weight: 500;
}

/* ─── Breadcrumb ─────────────────────────────────────────────── */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.breadcrumb::-webkit-scrollbar {
  display: none;
}

.crumb {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-tertiary);
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  padding: 4px 6px;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.crumb:active {
  background: rgba(0, 0, 0, 0.04);
}

.crumb.active {
  color: var(--color-text);
  font-weight: 500;
}

.crumb-sep {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* ─── Search Bar ─────────────────────────────────────────────── */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  margin: 8px 0;
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

/* ─── Sort Menu ──────────────────────────────────────────────── */
.sort-menu {
  position: absolute;
  right: 20px;
  top: calc(env(safe-area-inset-top, 12px) + 48px);
  background: var(--color-bg);
  border-radius: 14px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  padding: 4px 0;
  z-index: 50;
  min-width: 160px;
}

.sort-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  font-size: 15px;
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.15s ease;
}

.sort-option:active {
  background: rgba(0, 0, 0, 0.04);
}

.sort-option.active {
  color: var(--color-accent);
  font-weight: 500;
}

.sort-option svg {
  width: 16px;
  height: 16px;
}

.sort-divider {
  height: 0.5px;
  background: var(--color-border);
  margin: 4px 0;
}

/* ─── File List ──────────────────────────────────────────────── */
.file-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 20px;
}

/* ─── List View ──────────────────────────────────────────────── */
.list-view {
  display: flex;
  flex-direction: column;
}

.list-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 0.5px solid var(--color-border);
  cursor: pointer;
  transition: background 0.15s ease;
  animation: fadeInUp 0.3s ease both;
}

.list-item:nth-child(1) { animation-delay: 0s; }
.list-item:nth-child(2) { animation-delay: 0.03s; }
.list-item:nth-child(3) { animation-delay: 0.06s; }
.list-item:nth-child(4) { animation-delay: 0.09s; }
.list-item:nth-child(5) { animation-delay: 0.12s; }

.list-item:active {
  background: rgba(0, 0, 0, 0.02);
}

.list-item.selected {
  background: var(--color-accent-soft);
}

.select-check {
  width: 24px;
  height: 24px;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
}

.check-circle {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.check-circle.checked {
  background: var(--color-accent);
  border-color: var(--color-accent);
}

.check-circle svg {
  width: 14px;
  height: 14px;
}

.item-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.03);
}

.item-icon.folder {
  background: rgba(0, 122, 255, 0.06);
}

.item-icon svg {
  width: 24px;
  height: 24px;
}

.item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 16px;
  font-weight: 400;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.meta-sep {
  margin: 0 4px;
}

.item-actions {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: none;
  border: none;
  color: var(--color-text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.item-actions:active {
  background: rgba(0, 0, 0, 0.06);
}

.item-actions svg {
  width: 16px;
  height: 16px;
}

/* ─── Grid View ──────────────────────────────────────────────── */
.grid-view {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 8px 0;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: 14px;
  cursor: pointer;
  transition: background 0.15s ease;
  position: relative;
  animation: fadeInUp 0.3s ease both;
}

.grid-item:nth-child(1) { animation-delay: 0s; }
.grid-item:nth-child(2) { animation-delay: 0.03s; }
.grid-item:nth-child(3) { animation-delay: 0.06s; }
.grid-item:nth-child(4) { animation-delay: 0.09s; }
.grid-item:nth-child(5) { animation-delay: 0.12s; }
.grid-item:nth-child(6) { animation-delay: 0.15s; }

.grid-item:active {
  background: rgba(0, 0, 0, 0.03);
}

.grid-item.selected {
  background: var(--color-accent-soft);
}

.grid-check {
  position: absolute;
  top: 8px;
  left: 8px;
}

.grid-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.03);
}

.grid-icon.folder {
  background: rgba(0, 122, 255, 0.06);
}

.grid-icon svg {
  width: 28px;
  height: 28px;
}

.grid-name {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text);
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
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

/* ─── Bottom Bar ─────────────────────────────────────────────── */
.bottom-bar {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 12px 20px calc(env(safe-area-inset-bottom, 8px) + 12px);
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-top: 0.5px solid var(--color-border);
}

.bar-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: none;
  border: none;
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.bar-btn:active {
  transform: scale(0.9);
  background: var(--color-accent-soft);
}

.bar-btn:disabled {
  color: var(--color-text-muted);
  cursor: default;
}

.bar-btn:disabled:active {
  transform: none;
  background: none;
}

.bar-btn svg {
  width: 22px;
  height: 22px;
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
}

.modal-body {
  padding: 8px 20px 32px;
}

.modal-body.center-text {
  text-align: center;
}

.modal-input {
  width: 100%;
  font-size: 17px;
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

.delete-text {
  font-size: 16px;
  color: var(--color-text);
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.modal-action-btn {
  flex: 1;
  padding: 14px;
  border-radius: 14px;
  border: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.modal-action-btn:active {
  transform: scale(0.98);
}

.modal-action-btn.cancel {
  background: rgba(0, 0, 0, 0.06);
  color: var(--color-text);
}

.modal-action-btn.danger {
  background: var(--color-danger);
  color: #fff;
}

/* ─── Info Modal ─────────────────────────────────────────────── */
.info-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 8px 0 20px;
}

.info-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.03);
}

.info-icon.folder {
  background: rgba(0, 122, 255, 0.06);
}

.info-icon svg {
  width: 28px;
  height: 28px;
}

.info-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  text-align: center;
  word-break: break-all;
}

.info-rows {
  background: var(--color-bg);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 0.5px solid var(--color-border);
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 15px;
  color: var(--color-text);
}

.info-value {
  font-size: 15px;
  color: var(--color-text-secondary);
}

.info-actions {
  display: flex;
  gap: 12px;
}

.info-action-btn {
  flex: 1;
  padding: 14px;
  border-radius: 14px;
  border: none;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  background: rgba(0, 0, 0, 0.06);
  color: var(--color-text);
}

.info-action-btn.danger {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}

.info-action-btn:active {
  transform: scale(0.98);
}

/* ─── File Editor ────────────────────────────────────────────── */
.editor-screen {
  position: fixed;
  inset: 0;
  background: var(--color-bg);
  z-index: 200;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top, 12px) + 8px) 20px 12px;
  border-bottom: 0.5px solid var(--color-border);
}

.editor-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  text-align: center;
}

.editor-textarea {
  flex: 1;
  width: 100%;
  border: none;
  background: none;
  font-size: 16px;
  font-family: inherit;
  color: var(--color-text);
  padding: 20px;
  outline: none;
  resize: none;
  line-height: 1.6;
}

.editor-textarea::placeholder {
  color: var(--color-text-muted);
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

.modal-enter-from, .modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal, .modal-leave-to .modal {
  transform: translateY(100%);
}

.slide-up-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-up-leave-active {
  transition: all 0.2s ease-in;
}

.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
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
  background: rgba(0, 0, 0, 0.3);
}

/* ─── Responsive ─────────────────────────────────────────────── */
@media (min-width: 768px) {
  .grid-view {
    grid-template-columns: repeat(4, 1fr);
  }

  .item-icon {
    width: 48px;
    height: 48px;
  }

  .item-name {
    font-size: 17px;
  }
}
</style>
