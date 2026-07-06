<script setup lang="ts">
import StatusBar from './StatusBar.vue'
import TimeDisplay from './TimeDisplay.vue'
import BottomActions from './BottomActions.vue'
import SwipeIndicator from './SwipeIndicator.vue'
import { useSwipeGestures } from 'micronet-kernel'
import { useNavigation } from '../kernel'

const { goTo } = useNavigation()

const { targetRef, dragProgress, isDragging } =
  useSwipeGestures({
    onSwipeUp: () => goTo('home'),
  })
</script>

<template>
  <div
    :ref="targetRef"
    class="lock-screen"
    :class="{ dragging: isDragging }"
  >
    <div
      class="content"
      :style="{
        transform: `translateY(${-dragProgress * 30}px)`,
        opacity: 1 - dragProgress * 0.2,
      }"
    >
      <StatusBar />
      <div class="main">
        <TimeDisplay />
      </div>
      <div class="bottom">
        <BottomActions />
        <SwipeIndicator />
      </div>
    </div>
  </div>
</template>

<style scoped>
.lock-screen {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  user-select: none;
  cursor: grab;
  background: var(--color-bg);
  animation: breathe 8s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { background-color: var(--color-bg); }
  50% { background-color: var(--color-bg-warm); }
}

.lock-screen.dragging {
  cursor: grabbing;
}

.content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.1s ease-out, opacity 0.1s ease-out;
}

.main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.bottom {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: env(safe-area-inset-bottom, 24px);
  animation: fadeInUp 0.6s ease 0.2s both;
}

@media (min-width: 768px) {
  .bottom {
    gap: 20px;
    padding-bottom: 40px;
  }
}
</style>
