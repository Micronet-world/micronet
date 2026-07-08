import { ref, readonly, type Ref, type DeepReadonly } from 'vue'

export type KeyboardLayout = 'default' | 'shift' | 'numeric' | 'symbol'

export interface KeyboardOptions {
  layout?: KeyboardLayout
  initialValue?: string
  onSubmit?: (value: string) => void
}

const isVisible = ref(false)
const inputValue = ref('')
const activeElement = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
const currentLayout = ref<KeyboardLayout>('default')
const isShiftActive = ref(false)

let focusInHandler: ((e: FocusEvent) => void) | null = null
let focusOutHandler: ((e: FocusEvent) => void) | null = null
let initialized = false
let initCount = 0

function isKeyboardTarget(el: EventTarget | null): el is HTMLInputElement | HTMLTextAreaElement {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type
    return type === 'text' || type === 'search' || type === 'password' || type === 'email' || type === 'url' || type === 'tel' || type === ''
  }
  return tag === 'TEXTAREA'
}

function getLayoutForElement(el: HTMLInputElement | HTMLTextAreaElement): KeyboardLayout {
  if (el.tagName === 'TEXTAREA') return 'default'
  const type = (el as HTMLInputElement).type
  if (type === 'tel') return 'numeric'
  return 'default'
}

function initGlobalListeners() {
  initCount++
  if (initialized) return
  initialized = true

  focusInHandler = (e: FocusEvent) => {
    const el = e.target
    if (!isKeyboardTarget(el)) return
    activeElement.value = el
    inputValue.value = el.value
    currentLayout.value = getLayoutForElement(el)
    isShiftActive.value = false
    isVisible.value = true
  }

  focusOutHandler = () => {
    setTimeout(() => {
      const active = document.activeElement
      if (active && (active.closest('.keyboard-container') || active.closest('.simple-keyboard'))) {
        return
      }
      isVisible.value = false
      activeElement.value = null
    }, 150)
  }

  document.addEventListener('focusin', focusInHandler)
  document.addEventListener('focusout', focusOutHandler)
}

export function destroyKeyboardListeners() {
  initCount--
  if (initCount > 0) return
  if (!initialized) return
  initialized = false
  if (focusInHandler) document.removeEventListener('focusin', focusInHandler)
  if (focusOutHandler) document.removeEventListener('focusout', focusOutHandler)
  focusInHandler = null
  focusOutHandler = null
}

export interface UseKeyboardReturn {
  isVisible: DeepReadonly<Ref<boolean>>
  inputValue: DeepReadonly<Ref<string>>
  activeElement: DeepReadonly<Ref<HTMLInputElement | HTMLTextAreaElement | null>>
  currentLayout: DeepReadonly<Ref<KeyboardLayout>>
  isShiftActive: DeepReadonly<Ref<boolean>>
  show(options?: KeyboardOptions): void
  hide(): void
  toggle(options?: KeyboardOptions): void
  setInput(value: string): void
  syncActiveInput(value: string): void
  setLayout(layout: KeyboardLayout): void
  toggleShift(): void
  submit(): void
  destroy(): void
}

export function useKeyboard(): UseKeyboardReturn {
  initGlobalListeners()

  function show(options?: KeyboardOptions) {
    if (options?.layout) currentLayout.value = options.layout
    if (options?.initialValue !== undefined) inputValue.value = options.initialValue
    isVisible.value = true
  }

  function hide() {
    isVisible.value = false
    isShiftActive.value = false
    activeElement.value = null
  }

  function toggle(options?: KeyboardOptions) {
    if (isVisible.value) hide()
    else show(options)
  }

  function setInput(value: string) {
    inputValue.value = value
    if (activeElement.value) {
      activeElement.value.value = value
      activeElement.value.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  function syncActiveInput(value: string) {
    inputValue.value = value
    if (activeElement.value) {
      activeElement.value.value = value
      activeElement.value.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }

  function setLayout(layout: KeyboardLayout) {
    currentLayout.value = layout
    if (layout !== 'default') isShiftActive.value = false
  }

  function toggleShift() {
    isShiftActive.value = !isShiftActive.value
    currentLayout.value = isShiftActive.value ? 'shift' : 'default'
  }

  function submit() {
    if (activeElement.value) {
      activeElement.value.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
      activeElement.value.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }))
    }
    hide()
  }

  return {
    isVisible: readonly(isVisible),
    inputValue: readonly(inputValue),
    activeElement: readonly(activeElement),
    currentLayout: readonly(currentLayout),
    isShiftActive: readonly(isShiftActive),
    show,
    hide,
    toggle,
    setInput,
    syncActiveInput,
    setLayout,
    toggleShift,
    submit,
    destroy: destroyKeyboardListeners,
  }
}
