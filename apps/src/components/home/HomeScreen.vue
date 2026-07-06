<script setup lang="ts">
import StatusBar from '../StatusBar.vue'
import { useSwipeGestures } from 'micronet-kernel'
import { useI18n } from 'vue-i18n'
import { useNavigation } from '../../kernel'

const { t } = useI18n()
const { lock, goTo } = useNavigation()

const { targetRef, dragProgress, swipeDirection, isDragging } =
  useSwipeGestures({
    onSwipeDown: () => lock(),
  })

// --- Home bar gesture: swipe up to lock ---
const { targetRef: barTargetRef } =
  useSwipeGestures({
    onSwipeUp: () => lock(),
    threshold: 40,
  })
</script>

<template>
  <div
    :ref="targetRef"
    class="home-screen"
    :class="{ dragging: isDragging }"
  >
    <!-- Wallpaper -->
    <div class="wallpaper"></div>

    <!-- Content -->
    <div
      class="content"
      :style="{
        transform: `translateY(${swipeDirection === 'down' ? dragProgress * 30 : swipeDirection === 'up' ? -dragProgress * 30 : 0}px)`,
        opacity: 1 - dragProgress * 0.2,
      }"
    >
      <StatusBar />

      <div class="app-grid">
        <button class="app-icon" @click="goTo('camera')">
          <div class="icon-wrapper camera-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </div>
          <span class="app-name">{{ t('home.camera') }}</span>
        </button>

        <button class="app-icon" @click="goTo('photos')">
          <div class="icon-wrapper photos-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="app-name">{{ t('home.photos') }}</span>
        </button>

        <button class="app-icon" @click="goTo('maps')">
          <div class="icon-wrapper maps-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <span class="app-name">{{ t('home.maps') }}</span>
        </button>

        <button class="app-icon" @click="goTo('calendar')">
          <div class="icon-wrapper calendar-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="4" width="18" height="18" rx="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="16" y1="2" x2="16" y2="6" stroke-linecap="round"/>
              <line x1="8" y1="2" x2="8" y2="6" stroke-linecap="round"/>
              <line x1="3" y1="10" x2="21" y2="10" stroke-linecap="round"/>
              <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <span class="app-name">{{ t('home.calendar') }}</span>
        </button>

        <button class="app-icon" @click="goTo('clock')">
          <div class="icon-wrapper clock-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 6v6l4 2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="app-name">{{ t('home.clock') }}</span>
        </button>

        <button class="app-icon" @click="goTo('files')">
          <div class="icon-wrapper files-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="app-name">{{ t('home.files') }}</span>
        </button>

        <button class="app-icon" @click="goTo('notes')">
          <div class="icon-wrapper notes-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="14 2 14 8 20 8" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="16" y1="13" x2="8" y2="13" stroke-linecap="round"/>
              <line x1="16" y1="17" x2="8" y2="17" stroke-linecap="round"/>
              <polyline points="10 9 9 9 8 9" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="app-name">{{ t('home.notes') }}</span>
        </button>

        <button class="app-icon" @click="goTo('settings')">
          <div class="icon-wrapper settings-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="app-name">{{ t('home.settings') }}</span>
        </button>
      </div>

      <!-- Home bar -->
      <div
        :ref="barTargetRef"
        class="home-bar-area"
      >
        <div class="home-bar"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-screen {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  user-select: none;
  cursor: grab;
}

.home-screen.dragging {
  cursor: grabbing;
}

/* Warm white wallpaper */
.wallpaper {
  position: absolute;
  inset: 0;
  background: var(--color-bg);
  animation: breathe 8s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { background-color: var(--color-bg); }
  50% { background-color: var(--color-bg-warm); }
}

.content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.1s ease-out, opacity 0.1s ease-out;
}

/* App Grid */
.app-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(6, auto);
  gap: 24px 16px;
  padding: 24px 32px;
  align-content: start;
}

.app-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.2s ease;
}

.app-icon:active {
  transform: scale(0.9);
}

.icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.camera-icon {
  background: linear-gradient(135deg, #f0ece7 0%, #e4dfd9 100%);
  color: #6b6560;
}

.photos-icon {
  background: linear-gradient(135deg, #ede9e3 0%, #e0dbd4 100%);
  color: #7a7470;
}

.maps-icon {
  background: linear-gradient(135deg, #eae6e0 0%, #ddd8d1 100%);
  color: #68635e;
}

.calendar-icon {
  background: linear-gradient(135deg, #eae6e0 0%, #e0dcd6 100%);
  color: #6b6560;
}

.settings-icon {
  background: linear-gradient(135deg, #f2efe9 0%, #e5e1db 100%);
  color: #5c5854;
}

.clock-icon {
  background: linear-gradient(135deg, #e8e4de 0%, #ddd9d3 100%);
  color: #635e59;
}

.files-icon {
  background: linear-gradient(135deg, #e5e1db 0%, #dbd7d1 100%);
  color: #6b6560;
}

.notes-icon {
  background: linear-gradient(135deg, #f5f0e8 0%, #e8e3db 100%);
  color: #6b6560;
}

.icon-wrapper svg {
  width: 30px;
  height: 30px;
}

.app-name {
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text);
  letter-spacing: 0.2px;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Home bar */
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
  height: 5px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.15);
}

@media (min-width: 768px) {
  .icon-wrapper {
    width: 68px;
    height: 68px;
    border-radius: 16px;
  }

  .icon-wrapper svg {
    width: 34px;
    height: 34px;
  }

  .app-name {
    font-size: 12px;
  }
}
</style>
