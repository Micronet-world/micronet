import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { useSwipeGestures } from '../useSwipeGestures'

// jsdom does not define Touch / TouchEvent — polyfill minimally for tests
if (typeof globalThis.Touch === 'undefined') {
  class TouchImpl implements Touch {
    identifier: number
    target: EventTarget
    clientX: number
    clientY: number
    screenX: number
    screenY: number
    pageX: number
    pageY: number
    radiusX = 0
    radiusY = 0
    rotationAngle = 0
    force = 0
    constructor(init: { identifier: number; target: EventTarget; clientX: number; clientY: number }) {
      this.identifier = init.identifier
      this.target = init.target
      this.clientX = init.clientX
      this.clientY = init.clientY
      this.screenX = init.clientX
      this.screenY = init.clientY
      this.pageX = init.clientX
      this.pageY = init.clientY
    }
  }
  // @ts-expect-error polyfill
  globalThis.Touch = TouchImpl
}

if (typeof globalThis.TouchEvent === 'undefined') {
  class TouchEventImpl extends UIEvent {
    touches: TouchList
    targetTouches: TouchList
    changedTouches: TouchList
    constructor(type: string, init: { touches?: Touch[]; changedTouches?: Touch[]; bubbles?: boolean; cancelable?: boolean }) {
      super(type, init)
      const empty = [] as unknown as TouchList
      this.touches = (init.touches as unknown as TouchList) ?? empty
      this.changedTouches = (init.changedTouches as unknown as TouchList) ?? empty
      this.targetTouches = empty
    }
  }
  // @ts-expect-error polyfill
  globalThis.TouchEvent = TouchEventImpl
}

function createGestureComponent(opts: Parameters<typeof useSwipeGestures>[0] = {}) {
  let gestureApi: ReturnType<typeof useSwipeGestures>
  const wrapper = mount(
    defineComponent({
      setup() {
        gestureApi = useSwipeGestures(opts)
        return gestureApi
      },
      render() {
        return h('div', { ref: gestureApi.targetRef, class: 'target' })
      },
    }),
  )
  return { wrapper, api: gestureApi! }
}

function makeTouch(x: number, y: number, target?: EventTarget) {
  return new Touch({ identifier: 0, target: target ?? document.body, clientX: x, clientY: y })
}

function createTouchEvent(type: string, x: number, y: number, el?: HTMLElement) {
  const touch = makeTouch(x, y, el ?? document.body)
  const init: { touches?: Touch[]; changedTouches?: Touch[]; bubbles: boolean; cancelable: boolean } = {
    bubbles: true,
    cancelable: true,
  }
  if (type === 'touchend' || type === 'touchcancel') {
    init.changedTouches = [touch]
    init.touches = []
  } else {
    init.touches = [touch]
    init.changedTouches = []
  }
  return new TouchEvent(type, init)
}

function createMouseEvent(type: string, x: number, y: number) {
  return new MouseEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true })
}

describe('useSwipeGestures', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('targetRef attaches touch listeners to element', () => {
    const { wrapper } = createGestureComponent()
    const el = wrapper.element as HTMLElement
    expect(el.style.touchAction).toBe('none')
    expect(el.style.userSelect).toBe('none')
  })

  it('targetRef detaches on null', () => {
    const onSwipeUp = vi.fn()
    const { wrapper, api } = createGestureComponent({ onSwipeUp })
    const el = wrapper.element as HTMLElement
    api.targetRef(null)
    el.dispatchEvent(createTouchEvent('touchstart', 100, 300, el))
    el.dispatchEvent(createTouchEvent('touchmove', 100, 200, el))
    el.dispatchEvent(createTouchEvent('touchend', 100, 200))
    expect(onSwipeUp).not.toHaveBeenCalled()
  })

  it('same-element idempotency does not re-attach', () => {
    const { wrapper, api } = createGestureComponent()
    const el = wrapper.element as HTMLElement
    const addSpy = vi.spyOn(el, 'addEventListener')
    api.targetRef(el)
    expect(addSpy).not.toHaveBeenCalled()
  })

  it('swipe up triggers onSwipeUp callback', () => {
    const onSwipeUp = vi.fn()
    const { wrapper } = createGestureComponent({ onSwipeUp, threshold: 80 })
    const el = wrapper.element as HTMLElement
    el.dispatchEvent(createTouchEvent('touchstart', 100, 300, el))
    el.dispatchEvent(createTouchEvent('touchmove', 100, 250, el))
    el.dispatchEvent(createTouchEvent('touchmove', 100, 100, el))
    el.dispatchEvent(createTouchEvent('touchend', 100, 100))
    expect(onSwipeUp).toHaveBeenCalledOnce()
  })

  it('swipe down triggers onSwipeDown callback', () => {
    const onSwipeDown = vi.fn()
    const { wrapper } = createGestureComponent({ onSwipeDown, threshold: 80 })
    const el = wrapper.element as HTMLElement
    el.dispatchEvent(createTouchEvent('touchstart', 100, 100, el))
    el.dispatchEvent(createTouchEvent('touchmove', 100, 150, el))
    el.dispatchEvent(createTouchEvent('touchmove', 100, 300, el))
    el.dispatchEvent(createTouchEvent('touchend', 100, 300))
    expect(onSwipeDown).toHaveBeenCalledOnce()
  })

  it('swipe right triggers onSwipeRight callback', () => {
    const onSwipeRight = vi.fn()
    const { wrapper } = createGestureComponent({ onSwipeRight, threshold: 80 })
    const el = wrapper.element as HTMLElement
    el.dispatchEvent(createTouchEvent('touchstart', 100, 200, el))
    el.dispatchEvent(createTouchEvent('touchmove', 150, 200, el))
    el.dispatchEvent(createTouchEvent('touchmove', 300, 200, el))
    el.dispatchEvent(createTouchEvent('touchend', 300, 200))
    expect(onSwipeRight).toHaveBeenCalledOnce()
  })

  it('short swipe does NOT trigger callback', () => {
    const onSwipeUp = vi.fn()
    const { wrapper } = createGestureComponent({ onSwipeUp, threshold: 80 })
    const el = wrapper.element as HTMLElement
    el.dispatchEvent(createTouchEvent('touchstart', 100, 300, el))
    el.dispatchEvent(createTouchEvent('touchmove', 100, 250, el))
    el.dispatchEvent(createTouchEvent('touchend', 100, 250))
    expect(onSwipeUp).not.toHaveBeenCalled()
  })

  it('axis locking: dominant x movement locks to x axis', () => {
    const onSwipeUp = vi.fn()
    const onSwipeRight = vi.fn()
    const { wrapper } = createGestureComponent({ onSwipeUp, onSwipeRight, threshold: 80 })
    const el = wrapper.element as HTMLElement
    el.dispatchEvent(createTouchEvent('touchstart', 100, 200, el))
    el.dispatchEvent(createTouchEvent('touchmove', 200, 210, el))
    el.dispatchEvent(createTouchEvent('touchmove', 300, 210, el))
    el.dispatchEvent(createTouchEvent('touchend', 300, 210))
    expect(onSwipeRight).toHaveBeenCalledOnce()
    expect(onSwipeUp).not.toHaveBeenCalled()
  })

  it('axis locking: dominant y movement locks to y axis', () => {
    const onSwipeUp = vi.fn()
    const onSwipeRight = vi.fn()
    const { wrapper } = createGestureComponent({ onSwipeUp, onSwipeRight, threshold: 80 })
    const el = wrapper.element as HTMLElement
    el.dispatchEvent(createTouchEvent('touchstart', 200, 300, el))
    el.dispatchEvent(createTouchEvent('touchmove', 210, 200, el))
    el.dispatchEvent(createTouchEvent('touchmove', 210, 100, el))
    el.dispatchEvent(createTouchEvent('touchend', 210, 100))
    expect(onSwipeUp).toHaveBeenCalledOnce()
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('canSwipeVertical returning false prevents vertical swipe', () => {
    const onSwipeUp = vi.fn()
    const { wrapper } = createGestureComponent({ onSwipeUp, threshold: 80, canSwipeVertical: () => false })
    const el = wrapper.element as HTMLElement
    el.dispatchEvent(createTouchEvent('touchstart', 100, 300, el))
    el.dispatchEvent(createTouchEvent('touchmove', 100, 250, el))
    el.dispatchEvent(createTouchEvent('touchmove', 100, 100, el))
    el.dispatchEvent(createTouchEvent('touchend', 100, 100))
    expect(onSwipeUp).not.toHaveBeenCalled()
  })

  it('canSwipeHorizontal returning false prevents horizontal swipe', () => {
    const onSwipeRight = vi.fn()
    const { wrapper } = createGestureComponent({ onSwipeRight, threshold: 80, canSwipeHorizontal: () => false })
    const el = wrapper.element as HTMLElement
    el.dispatchEvent(createTouchEvent('touchstart', 100, 200, el))
    el.dispatchEvent(createTouchEvent('touchmove', 150, 200, el))
    el.dispatchEvent(createTouchEvent('touchmove', 300, 200, el))
    el.dispatchEvent(createTouchEvent('touchend', 300, 200))
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('dragProgress increases during drag', () => {
    const { wrapper, api } = createGestureComponent()
    const el = wrapper.element as HTMLElement
    expect(api.dragProgress.value).toBe(0)
    el.dispatchEvent(createTouchEvent('touchstart', 100, 300, el))
    el.dispatchEvent(createTouchEvent('touchmove', 100, 250, el))
    expect(api.dragProgress.value).toBeGreaterThan(0)
    el.dispatchEvent(createTouchEvent('touchend', 100, 250))
    expect(api.dragProgress.value).toBe(0)
  })

  it('isDragging is true during drag', () => {
    const { wrapper, api } = createGestureComponent()
    const el = wrapper.element as HTMLElement
    expect(api.isDragging.value).toBe(false)
    el.dispatchEvent(createTouchEvent('touchstart', 100, 300, el))
    expect(api.isDragging.value).toBe(true)
    el.dispatchEvent(createTouchEvent('touchend', 100, 300))
    expect(api.isDragging.value).toBe(false)
  })

  it('swipeDirection reflects current direction', () => {
    const { wrapper, api } = createGestureComponent()
    const el = wrapper.element as HTMLElement
    expect(api.swipeDirection.value).toBeNull()
    el.dispatchEvent(createTouchEvent('touchstart', 100, 300, el))
    el.dispatchEvent(createTouchEvent('touchmove', 100, 250, el))
    expect(api.swipeDirection.value).toBe('up')
    el.dispatchEvent(createTouchEvent('touchend', 100, 250))
    expect(api.swipeDirection.value).toBeNull()
  })

  it('touchcancel ends the gesture', () => {
    const { wrapper, api } = createGestureComponent()
    const el = wrapper.element as HTMLElement
    el.dispatchEvent(createTouchEvent('touchstart', 100, 300, el))
    expect(api.isDragging.value).toBe(true)
    el.dispatchEvent(createTouchEvent('touchcancel', 100, 300))
    expect(api.isDragging.value).toBe(false)
  })

  it('cleans up window listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const { wrapper } = createGestureComponent()
    const el = wrapper.element as HTMLElement
    el.dispatchEvent(createMouseEvent('mousedown', 100, 300))
    wrapper.unmount()
    expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('mouseup', expect.any(Function))
    removeSpy.mockRestore()
  })

  it('onHoldUp fires after holdDelay when swipe pauses', () => {
    const onHoldUp = vi.fn()
    const { wrapper } = createGestureComponent({ onHoldUp, threshold: 80, holdDelay: 250 })
    const el = wrapper.element as HTMLElement
    el.dispatchEvent(createTouchEvent('touchstart', 100, 300, el))
    el.dispatchEvent(createTouchEvent('touchmove', 100, 200, el))
    el.dispatchEvent(createTouchEvent('touchmove', 100, 100, el))
    expect(onHoldUp).not.toHaveBeenCalled()
    vi.advanceTimersByTime(250)
    expect(onHoldUp).toHaveBeenCalledOnce()
    el.dispatchEvent(createTouchEvent('touchend', 100, 100))
  })

  it('onHoldUp suppresses onSwipeUp on release', () => {
    const onSwipeUp = vi.fn()
    const onHoldUp = vi.fn()
    const { wrapper } = createGestureComponent({ onSwipeUp, onHoldUp, threshold: 80, holdDelay: 250 })
    const el = wrapper.element as HTMLElement
    el.dispatchEvent(createTouchEvent('touchstart', 100, 300, el))
    el.dispatchEvent(createTouchEvent('touchmove', 100, 200, el))
    el.dispatchEvent(createTouchEvent('touchmove', 100, 100, el))
    vi.advanceTimersByTime(250)
    expect(onHoldUp).toHaveBeenCalledOnce()
    el.dispatchEvent(createTouchEvent('touchend', 100, 100))
    expect(onSwipeUp).not.toHaveBeenCalled()
  })

  it('hold timer restarts on each qualifying move', () => {
    const onHoldUp = vi.fn()
    const { wrapper } = createGestureComponent({ onHoldUp, threshold: 80, holdDelay: 250 })
    const el = wrapper.element as HTMLElement
    el.dispatchEvent(createTouchEvent('touchstart', 100, 300, el))
    el.dispatchEvent(createTouchEvent('touchmove', 100, 200, el))
    el.dispatchEvent(createTouchEvent('touchmove', 100, 100, el))
    vi.advanceTimersByTime(100)
    expect(onHoldUp).not.toHaveBeenCalled()
    el.dispatchEvent(createTouchEvent('touchmove', 100, 90, el))
    vi.advanceTimersByTime(100)
    expect(onHoldUp).not.toHaveBeenCalled()
    vi.advanceTimersByTime(150)
    expect(onHoldUp).toHaveBeenCalledOnce()
    el.dispatchEvent(createTouchEvent('touchend', 100, 90))
  })
})
