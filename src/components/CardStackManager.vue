<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { getScreenMeta, isBackgroundCard } from '../screens/registry'
import type { ScreenId } from '../screens/types'

const props = defineProps<{
  screenStack: ScreenId[]
  currentScreen: ScreenId
  expanded: boolean
}>()

const emit = defineEmits<{
  'navigate-to': [screen: ScreenId]
  'collapse': []
}>()

/** Cards to render behind the current screen (max 3, most recent first) */
const backgroundCards = computed(() => {
  const stack = props.screenStack
  const cards = stack.slice(0, -1).filter(s => isBackgroundCard(s))
  return cards.slice(-3).reverse().map((screen, index) => ({
    ...getScreenMeta(screen),
    index,
    depth: index,
  }))
})

const hasCards = computed(() => backgroundCards.value.length > 0)

const handleCardClick = (screen: ScreenId) => {
  emit('navigate-to', screen)
}

// --- Collapse gesture (swipe down on expanded overlay) ---
const startY = ref(0)
const currentY = ref(0)
const isDragging = ref(false)
const dragProgress = ref(0)

const handleTouchStart = (e: TouchEvent) => {
  if (!props.expanded) return
  startY.value = e.touches[0].clientY
  currentY.value = startY.value
  isDragging.value = true
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isDragging.value) return
  currentY.value = e.touches[0].clientY
  const diff = currentY.value - startY.value
  dragProgress.value = Math.min(Math.max(diff / 150, 0), 1)
}

const handleTouchEnd = () => {
  if (!isDragging.value) return
  isDragging.value = false
  if (currentY.value - startY.value > 60) {
    emit('collapse')
  }
  dragProgress.value = 0
}

const handleMouseDown = (e: MouseEvent) => {
  if (!props.expanded) return
  startY.value = e.clientY
  currentY.value = startY.value
  isDragging.value = true
}

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return
  currentY.value = e.clientY
  const diff = currentY.value - startY.value
  dragProgress.value = Math.min(Math.max(diff / 150, 0), 1)
}

const handleMouseUp = () => {
  if (!isDragging.value) return
  isDragging.value = false
  if (currentY.value - startY.value > 60) {
    emit('collapse')
  }
  dragProgress.value = 0
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
})
</script>

<template>
  <div class="card-stack" :class="{ expanded, 'has-cards': hasCards }">
    <!-- Background blur layer -->
    <Transition name="fade">
      <div v-if="hasCards && expanded" class="backdrop" @click="emit('collapse')"></div>
    </Transition>

    <!-- Background cards (stacked behind) -->
    <div
      v-for="card in backgroundCards"
      :key="card.id + '-' + card.depth"
      class="background-card"
      :class="['depth-' + card.depth, { expanded }]"
      :style="{
        '--card-color': card.color,
        '--card-index': card.depth,
        '--drag-offset': expanded ? dragProgress * 40 + 'px' : '0px',
      }"
      @click="handleCardClick(card.id)"
    >
      <div class="card-preview">
        <div class="card-header">
          <span class="card-icon">{{ card.icon }}</span>
          <span class="card-label">{{ card.label }}</span>
        </div>
        <div class="card-body">
          <div class="card-placeholder-line"></div>
          <div class="card-placeholder-line short"></div>
          <div class="card-placeholder-line"></div>
        </div>
      </div>
    </div>

    <!-- Current screen (rendered by parent via slot) -->
    <div
      class="current-screen"
      :class="{ expanded }"
      :style="{
        '--screen-lift': expanded ? (-20 + dragProgress * 60) + 'px' : '0px',
      }"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      @mousedown="handleMouseDown"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.card-stack {
  position: relative;
  width: 100%;
  height: 100%;
}

/* Backdrop */
.backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  z-index: 0;
  cursor: pointer;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Background cards — default: peeking behind */
.background-card {
  position: absolute;
  z-index: 1;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition:
    transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.4s ease,
    box-shadow 0.4s ease,
    bottom 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    right 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    height 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: auto;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.06);
}

.background-card:active {
  transform: scale(0.96) !important;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.18),
    0 1px 4px rgba(0, 0, 0, 0.08);
}

/* ── Depth 0: closest behind current ── */
.background-card.depth-0 {
  width: calc(100% - 24px);
  height: calc(100% - 32px);
  bottom: -8px;
  right: -8px;
  transform: scale(0.94) translateY(8px);
  opacity: 0.95;
  z-index: 2;
}

/* Expanded: cards fan out */
.background-card.depth-0.expanded {
  width: calc(100% - 32px);
  height: 55%;
  bottom: 42%;
  right: 16px;
  transform: scale(1) translateY(var(--drag-offset, 0px));
  opacity: 1;
}

/* ── Depth 1: middle card ── */
.background-card.depth-1 {
  width: calc(100% - 40px);
  height: calc(100% - 56px);
  bottom: -16px;
  right: -16px;
  transform: scale(0.88) translateY(16px);
  opacity: 0.8;
  z-index: 1;
}

.background-card.depth-1.expanded {
  width: calc(100% - 48px);
  height: 55%;
  bottom: 40%;
  right: 24px;
  transform: scale(1) translateY(var(--drag-offset, 0px));
  opacity: 0.95;
}

/* ── Depth 2: furthest card ── */
.background-card.depth-2 {
  width: calc(100% - 56px);
  height: calc(100% - 80px);
  bottom: -24px;
  right: -24px;
  transform: scale(0.82) translateY(24px);
  opacity: 0.6;
  z-index: 0;
}

.background-card.depth-2.expanded {
  width: calc(100% - 64px);
  height: 55%;
  bottom: 38%;
  right: 32px;
  transform: scale(1) translateY(var(--drag-offset, 0px));
  opacity: 0.9;
}

/* Card preview content */
.card-preview {
  width: 100%;
  height: 100%;
  background: var(--card-color, #faf9f6);
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.card-icon {
  font-size: 14px;
}

.card-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  opacity: 0.8;
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
}

.card-placeholder-line {
  height: 8px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 4px;
  width: 80%;
}

.card-placeholder-line.short {
  width: 50%;
}

/* ── Current screen ── */
.current-screen {
  position: relative;
  z-index: 10;
  width: 100%;
  height: 100%;
  border-radius: 0;
  overflow: hidden;
  transition:
    transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
    border-radius 0.45s ease,
    box-shadow 0.45s ease;
}

.current-screen.expanded {
  transform: translateY(var(--screen-lift, -20px));
  border-radius: 20px 20px 0 0;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.1);
  cursor: grab;
}

/* Responsive */
@media (min-width: 768px) {
  .background-card.depth-0 {
    width: calc(100% - 32px);
    height: calc(100% - 40px);
    bottom: -12px;
    right: -12px;
  }

  .background-card.depth-0.expanded {
    width: calc(100% - 48px);
    height: 52%;
    bottom: 44%;
    right: 24px;
  }

  .background-card.depth-1 {
    width: calc(100% - 56px);
    height: calc(100% - 72px);
    bottom: -20px;
    right: -20px;
  }

  .background-card.depth-1.expanded {
    width: calc(100% - 64px);
    height: 52%;
    bottom: 42%;
    right: 32px;
  }

  .background-card.depth-2 {
    width: calc(100% - 80px);
    height: calc(100% - 104px);
    bottom: -28px;
    right: -28px;
  }

  .background-card.depth-2.expanded {
    width: calc(100% - 80px);
    height: 52%;
    bottom: 40%;
    right: 40px;
  }
}
</style>
