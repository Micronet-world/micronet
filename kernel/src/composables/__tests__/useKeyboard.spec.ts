import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { nextTick } from 'vue'
import { useKeyboard } from '../useKeyboard'

describe('useKeyboard', () => {
  let keyboard: ReturnType<typeof useKeyboard>

  beforeEach(() => {
    keyboard = useKeyboard()
    keyboard.hide()
  })

  afterEach(() => {
    keyboard.destroy()
    vi.restoreAllMocks()
  })

  it('initializes with keyboard hidden', () => {
    expect(keyboard.isVisible.value).toBe(false)
  })

  it('initializes with empty input', () => {
    expect(keyboard.inputValue.value).toBe('')
  })

  it('initializes with default layout', () => {
    expect(keyboard.currentLayout.value).toBe('default')
  })

  it('initializes with shift inactive', () => {
    expect(keyboard.isShiftActive.value).toBe(false)
  })

  it('show() makes keyboard visible', () => {
    keyboard.show()
    expect(keyboard.isVisible.value).toBe(true)
  })

  it('hide() hides keyboard', () => {
    keyboard.show()
    expect(keyboard.isVisible.value).toBe(true)
    keyboard.hide()
    expect(keyboard.isVisible.value).toBe(false)
  })

  it('toggle() toggles visibility', () => {
    expect(keyboard.isVisible.value).toBe(false)
    keyboard.toggle()
    expect(keyboard.isVisible.value).toBe(true)
    keyboard.toggle()
    expect(keyboard.isVisible.value).toBe(false)
  })

  it('show() with layout option sets layout', () => {
    keyboard.show({ layout: 'numeric' })
    expect(keyboard.currentLayout.value).toBe('numeric')
  })

  it('show() with initialValue sets input', () => {
    keyboard.show({ initialValue: 'hello' })
    expect(keyboard.inputValue.value).toBe('hello')
  })

  it('setLayout() changes layout', () => {
    keyboard.setLayout('numeric')
    expect(keyboard.currentLayout.value).toBe('numeric')
  })

  it('setLayout() resets shift for non-default layouts', () => {
    keyboard.toggleShift()
    expect(keyboard.isShiftActive.value).toBe(true)
    keyboard.setLayout('numeric')
    expect(keyboard.isShiftActive.value).toBe(false)
  })

  it('toggleShift() toggles shift state', () => {
    expect(keyboard.isShiftActive.value).toBe(false)
    keyboard.toggleShift()
    expect(keyboard.isShiftActive.value).toBe(true)
    expect(keyboard.currentLayout.value).toBe('shift')
    keyboard.toggleShift()
    expect(keyboard.isShiftActive.value).toBe(false)
    expect(keyboard.currentLayout.value).toBe('default')
  })

  it('setInput() updates inputValue', () => {
    keyboard.setInput('test')
    expect(keyboard.inputValue.value).toBe('test')
  })

  it('syncActiveInput() updates inputValue', () => {
    keyboard.syncActiveInput('synced')
    expect(keyboard.inputValue.value).toBe('synced')
  })

  it('auto-shows keyboard on input focus', async () => {
    const input = document.createElement('input')
    input.type = 'text'
    document.body.appendChild(input)

    const event = new Event('focusin', { bubbles: true })
    Object.defineProperty(event, 'target', { value: input, writable: false })
    document.dispatchEvent(event)
    await nextTick()

    expect(keyboard.isVisible.value).toBe(true)
    expect(keyboard.activeElement.value).toBe(input)

    document.body.removeChild(input)
  })

  it('auto-shows keyboard on textarea focus', async () => {
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)

    const event = new Event('focusin', { bubbles: true })
    Object.defineProperty(event, 'target', { value: textarea, writable: false })
    document.dispatchEvent(event)
    await nextTick()

    expect(keyboard.isVisible.value).toBe(true)

    document.body.removeChild(textarea)
  })

  it('sets numeric layout for tel inputs', async () => {
    const input = document.createElement('input')
    input.type = 'tel'
    document.body.appendChild(input)

    const event = new Event('focusin', { bubbles: true })
    Object.defineProperty(event, 'target', { value: input, writable: false })
    document.dispatchEvent(event)
    await nextTick()

    expect(keyboard.currentLayout.value).toBe('numeric')

    document.body.removeChild(input)
  })

  it('does not show keyboard for checkbox inputs', async () => {
    const input = document.createElement('input')
    input.type = 'checkbox'
    document.body.appendChild(input)

    const event = new Event('focusin', { bubbles: true })
    Object.defineProperty(event, 'target', { value: input, writable: false })
    document.dispatchEvent(event)
    await nextTick()

    expect(keyboard.isVisible.value).toBe(false)

    document.body.removeChild(input)
  })

  it('hide() resets shift state', () => {
    keyboard.show()
    keyboard.toggleShift()
    expect(keyboard.isShiftActive.value).toBe(true)
    keyboard.hide()
    expect(keyboard.isShiftActive.value).toBe(false)
  })
})
