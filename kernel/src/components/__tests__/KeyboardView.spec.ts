import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useKeyboard } from '../../composables/useKeyboard'

vi.mock('simple-keyboard', () => {
  return {
    default: class MockKeyboard {
      constructor() {}
      setInput() {}
      getInput() { return '' }
      setOptions() {}
      destroy() {}
    },
  }
})

vi.mock('simple-keyboard/build/css/index.css', () => ({}))

describe('KeyboardView', () => {
  let keyboard: ReturnType<typeof useKeyboard>

  beforeEach(async () => {
    keyboard = useKeyboard()
    keyboard.hide()
    document.body.classList.remove('keyboard-visible')
  })

  afterEach(() => {
    keyboard.hide()
    document.body.classList.remove('keyboard-visible')
  })

  it('adds keyboard-visible class to body when shown', async () => {
    const { default: KeyboardView } = await import('../KeyboardView.vue')
    mount(KeyboardView)
    keyboard.show()
    await nextTick()
    await nextTick()
    expect(document.body.classList.contains('keyboard-visible')).toBe(true)
  })

  it('removes keyboard-visible class from body when hidden', async () => {
    const { default: KeyboardView } = await import('../KeyboardView.vue')
    mount(KeyboardView)
    keyboard.show()
    await nextTick()
    await nextTick()
    expect(document.body.classList.contains('keyboard-visible')).toBe(true)
    keyboard.hide()
    await nextTick()
    expect(document.body.classList.contains('keyboard-visible')).toBe(false)
  })

  it('renders nothing when keyboard is hidden', async () => {
    const { default: KeyboardView } = await import('../KeyboardView.vue')
    const wrapper = mount(KeyboardView)
    expect(wrapper.find('.keyboard-container').exists()).toBe(false)
  })

  it('renders keyboard when visible', async () => {
    const { default: KeyboardView } = await import('../KeyboardView.vue')
    const wrapper = mount(KeyboardView)
    keyboard.show()
    await nextTick()
    await nextTick()
    expect(wrapper.find('.keyboard-container').exists()).toBe(true)
  })

  it('renders done button', async () => {
    const { default: KeyboardView } = await import('../KeyboardView.vue')
    const wrapper = mount(KeyboardView)
    keyboard.show()
    await nextTick()
    await nextTick()
    expect(wrapper.find('.keyboard-done').exists()).toBe(true)
  })

  it('done button hides keyboard', async () => {
    const { default: KeyboardView } = await import('../KeyboardView.vue')
    const wrapper = mount(KeyboardView)
    keyboard.show()
    await nextTick()
    await nextTick()
    await wrapper.find('.keyboard-done').trigger('click')
    expect(keyboard.isVisible.value).toBe(false)
  })

  it('renders keyboard header and body', async () => {
    const { default: KeyboardView } = await import('../KeyboardView.vue')
    const wrapper = mount(KeyboardView)
    keyboard.show()
    await nextTick()
    await nextTick()
    expect(wrapper.find('.keyboard-header').exists()).toBe(true)
    expect(wrapper.find('.keyboard-body').exists()).toBe(true)
    expect(wrapper.find('.keyboard-safe-area').exists()).toBe(true)
  })
})
