import { ref, onUnmounted } from 'vue'

export interface SwipeOptions {
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  onSwipeRight?: () => void
  threshold?: number
  canSwipeVertical?: () => boolean
  canSwipeHorizontal?: () => boolean
}

function getXY(e: TouchEvent | MouseEvent): { x: number; y: number } {
  if ('touches' in e && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  if ('changedTouches' in e && e.changedTouches.length > 0) {
    return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
  }
  return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY }
}

export function useSwipeGestures(options: SwipeOptions) {
  const {
    onSwipeUp,
    onSwipeDown,
    onSwipeRight,
    threshold = 80,
    canSwipeVertical,
    canSwipeHorizontal,
  } = options

  const dragProgress = ref(0)
  const swipeDirection = ref<'up' | 'down' | 'left' | 'right' | null>(null)
  const isDragging = ref(false)

  let startX = 0
  let startY = 0
  let lastX = 0
  let lastY = 0
  let lockedAxis: 'x' | 'y' | null = null
  let attachedTo: HTMLElement | null = null

  function onStart(e: TouchEvent | MouseEvent) {
    const { x, y } = getXY(e)
    isDragging.value = true
    swipeDirection.value = null
    lockedAxis = null
    startX = x
    startY = y
    lastX = x
    lastY = y

    // For mouse: attach move/end on window so dragging outside the element still works
    if (!('touches' in e)) {
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onMouseUp)
    }
  }

  function onMove(e: TouchEvent | MouseEvent) {
    if (!isDragging.value) return

    const { x, y } = getXY(e)
    lastX = x
    lastY = y
    const dx = x - startX
    const dy = y - startY

    // Lock to dominant axis after initial movement
    if (!lockedAxis && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
      lockedAxis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    }

    if (lockedAxis === 'y') {
      const vertOk = canSwipeVertical ? canSwipeVertical() : true
      if (!vertOk) {
        dragProgress.value = 0
        swipeDirection.value = null
        return
      }
      swipeDirection.value = dy > 0 ? 'down' : dy < 0 ? 'up' : null
      dragProgress.value = Math.min(Math.max(Math.abs(dy) / 150, 0), 1)
    } else if (lockedAxis === 'x') {
      const horizOk = canSwipeHorizontal ? canSwipeHorizontal() : true
      if (!horizOk) {
        dragProgress.value = 0
        swipeDirection.value = null
        return
      }
      swipeDirection.value = dx > 0 ? 'right' : dx < 0 ? 'left' : null
      dragProgress.value = Math.min(Math.max(Math.abs(dx) / 150, 0), 1)
    }
  }

  function onEnd() {
    if (!isDragging.value) return
    isDragging.value = false

    // Use the last-known pointer position: end events (e.g. touchend) frequently
    // carry no coordinates, so re-reading the event would yield NaN deltas.
    const dx = lastX - startX
    const dy = lastY - startY

    if (lockedAxis === 'y') {
      const vertOk = canSwipeVertical ? canSwipeVertical() : true
      if (vertOk && dy < -threshold && onSwipeUp) onSwipeUp()
      else if (vertOk && dy > threshold && onSwipeDown) onSwipeDown()
    } else if (lockedAxis === 'x') {
      const horizOk = canSwipeHorizontal ? canSwipeHorizontal() : true
      if (horizOk && dx > threshold && onSwipeRight) onSwipeRight()
    }

    dragProgress.value = 0
    swipeDirection.value = null
    lockedAxis = null
  }

  function onMouseUp() {
    onEnd()
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  function attach(el: HTMLElement) {
    detach()
    attachedTo = el
    el.style.touchAction = 'none'
    el.style.userSelect = 'none'
    el.style.webkitUserSelect = 'none'
    // Touch events are always delivered to the touchstart target
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: true })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onEnd, { passive: true })
    // Mouse: only start on the element; move/end go on window (see onStart)
    el.addEventListener('mousedown', onStart)
  }

  function detach() {
    if (!attachedTo) return
    const el = attachedTo
    el.removeEventListener('touchstart', onStart)
    el.removeEventListener('touchmove', onMove)
    el.removeEventListener('touchend', onEnd)
    el.removeEventListener('touchcancel', onEnd)
    el.removeEventListener('mousedown', onStart)
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onMouseUp)
    attachedTo = null
  }

  // Stable function reference. Vue re-invokes template ref functions on
  // reactive re-renders, so guard against re-attaching to the same element —
  // otherwise attach()→detach() would drop the window listeners onStart()
  // adds mid-gesture, breaking mouse drags.
  function targetRef(el: unknown) {
    if (el instanceof HTMLElement) {
      if (attachedTo === el) return
      attach(el)
    } else if (el === null) {
      detach()
    }
  }

  onUnmounted(() => {
    detach()
  })

  return {
    targetRef,
    dragProgress,
    swipeDirection,
    isDragging,
  }
}
