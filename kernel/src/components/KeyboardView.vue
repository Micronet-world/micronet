<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import Keyboard from 'simple-keyboard'
import 'simple-keyboard/build/css/index.css'
import { useKeyboard } from '../composables/useKeyboard'

const {
  isVisible,
  inputValue,
  currentLayout,
  isShiftActive,
  syncActiveInput,
  toggleShift,
  setLayout,
  hide,
  destroy,
} = useKeyboard()

const keyboardRef = ref<HTMLElement | null>(null)
let keyboard: Keyboard | null = null
let ignoreChangeEvent = false

const defaultLayout = {
  default: [
    'q w e r t y u i o p',
    'a s d f g h j k l',
    '{shift} z x c v b n m {bksp}',
    '{123} , {space} . {enter}',
  ],
  shift: [
    'Q W E R T Y U I O P',
    'A S D F G H J K L',
    '{shift} Z X C V B N M {bksp}',
    '{123} , {space} . {enter}',
  ],
  numeric: [
    '1 2 3 4 5 6 7 8 9 0',
    '- / : ; ( ) $ & @',
    '{abc} . , ? ! \' " {bksp}',
    '{symbol} , {space} . {enter}',
  ],
  symbol: [
    '[ ] { } # % ^ * + =',
    '_ \\ | ~ < > \u20ac \u00a3 \u00a5',
    '{abc} . , ? ! \' " {bksp}',
    '{123} , {space} . {enter}',
  ],
}

const display = {
  '{shift}': '\u21E7',
  '{bksp}': '\u232B',
  '{enter}': '\u23CE',
  '{space}': 'space',
  '{123}': '123',
  '{abc}': 'ABC',
  '{symbol}': '#+=',
}

function initKeyboard() {
  if (!keyboardRef.value || keyboard) return

  keyboard = new Keyboard(keyboardRef.value, {
    layout: defaultLayout,
    display,
    theme: 'hg-theme-micronet hg-layout-default',
    baseClass: 'hg-base',
    buttonTheme: [
      { class: 'hg-key-special', buttons: '{shift} {bksp} {enter} {123} {abc} {symbol}' },
      { class: 'hg-key-wide', buttons: '{space}' },
      { class: 'hg-key-action', buttons: '{enter}' },
    ],
    onChange: (input: string) => {
      if (ignoreChangeEvent) return
      syncActiveInput(input)
    },
    onKeyPress: (button: string) => {
      handleKeyPress(button)
    },
    useMouseEvents: true,
    useTouchEvents: true,
    autoUseTouchEvents: true,
    preventMouseDownDefault: true,
    preventMouseUpDefault: true,
    stopMouseDownPropagation: false,
    stopMouseUpPropagation: false,
    disableCaretPositioning: false,
  })
}

function handleKeyPress(button: string) {
  if (button === '{shift}') {
    toggleShift()
    keyboard?.setOptions({
      layout: {
        default: isShiftActive.value ? defaultLayout.shift : defaultLayout.default,
        shift: defaultLayout.shift,
        numeric: defaultLayout.numeric,
        symbol: defaultLayout.symbol,
      },
    })
    return
  }

  if (button === '{bksp}') {
    const current = keyboard?.getInput() || ''
    ignoreChangeEvent = true
    syncActiveInput(current)
    ignoreChangeEvent = false
    return
  }

  if (button === '{enter}') {
    hide()
    return
  }

  if (button === '{123}') {
    setLayout('numeric')
    keyboard?.setOptions({
      layout: { numeric: defaultLayout.numeric, symbol: defaultLayout.symbol },
      layoutName: 'numeric',
    })
    return
  }

  if (button === '{abc}') {
    setLayout('default')
    keyboard?.setOptions({
      layout: {
        default: isShiftActive.value ? defaultLayout.shift : defaultLayout.default,
        shift: defaultLayout.shift,
        numeric: defaultLayout.numeric,
        symbol: defaultLayout.symbol,
      },
      layoutName: 'default',
    })
    return
  }

  if (button === '{symbol}') {
    keyboard?.setOptions({
      layoutName: 'symbol',
    })
    return
  }

  if (isShiftActive.value) {
    toggleShift()
    keyboard?.setOptions({
      layout: {
        default: defaultLayout.default,
        shift: defaultLayout.shift,
        numeric: defaultLayout.numeric,
        symbol: defaultLayout.symbol,
      },
    })
  }
}

watch(isVisible, (visible) => {
  document.body.classList.toggle('keyboard-visible', visible)
  if (visible) {
    nextTick(() => {
      if (!keyboard) initKeyboard()
      if (keyboard) {
        keyboard.setInput(inputValue.value)
        keyboard.setOptions({
          layout: {
            default: isShiftActive.value ? defaultLayout.shift : defaultLayout.default,
            shift: defaultLayout.shift,
            numeric: defaultLayout.numeric,
            symbol: defaultLayout.symbol,
          },
          layoutName: currentLayout.value === 'numeric' ? 'numeric' : 'default',
        })
      }
    })
  }
})

watch(inputValue, (val) => {
  if (keyboard && isVisible.value) {
    const current = keyboard.getInput()
    if (current !== val) {
      keyboard.setInput(val)
    }
  }
})

onMounted(() => {
  if (isVisible.value) initKeyboard()
})

onUnmounted(() => {
  keyboard?.destroy()
  keyboard = null
  destroy()
})
</script>

<template>
  <Transition name="keyboard-slide">
    <div
      v-if="isVisible"
      class="keyboard-container"
      @mousedown.prevent
      @touchstart.passive
    >
      <div class="keyboard-header">
        <button class="keyboard-done" @click="hide">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
      <div ref="keyboardRef" class="keyboard-body"></div>
      <div class="keyboard-safe-area"></div>
    </div>
  </Transition>
</template>

<style>
.hg-base {
  background: transparent !important;
  padding: 0 !important;
  margin: 0 !important;
}

.hg-theme-micronet {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

.hg-theme-micronet .hg-row {
  gap: 6px;
  margin-bottom: 6px;
  display: flex;
  justify-content: center;
}

.hg-theme-micronet .hg-row:last-child {
  margin-bottom: 0;
}

.hg-theme-micronet .hg-button {
  background: rgba(255, 255, 255, 0.92) !important;
  border: none !important;
  border-radius: 8px !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 0.5px 0 rgba(0, 0, 0, 0.04) !important;
  color: #1a1a1a !important;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif !important;
  font-size: 20px !important;
  font-weight: 400 !important;
  height: 46px !important;
  min-width: 32px !important;
  padding: 0 8px !important;
  cursor: pointer !important;
  transition: background 0.08s ease, transform 0.08s ease !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-transform: none !important;
  flex: 1 !important;
  max-width: 44px !important;
}

.hg-theme-micronet .hg-button:active {
  background: rgba(0, 0, 0, 0.12) !important;
  transform: scale(0.95) !important;
}

.hg-theme-micronet .hg-button.hg-key-special {
  background: rgba(180, 185, 195, 0.65) !important;
  font-size: 18px !important;
  flex: 1.3 !important;
  max-width: 56px !important;
}

.hg-theme-micronet .hg-button.hg-key-special:active {
  background: rgba(160, 165, 175, 0.75) !important;
}

.hg-theme-micronet .hg-button.hg-key-wide {
  flex: 5 !important;
  max-width: 200px !important;
  background: rgba(255, 255, 255, 0.92) !important;
}

.hg-theme-micronet .hg-button.hg-key-action {
  background: #007aff !important;
  color: white !important;
  font-size: 18px !important;
  flex: 1.5 !important;
  max-width: 64px !important;
}

.hg-theme-micronet .hg-button.hg-key-action:active {
  background: #0066d6 !important;
}

.hg-theme-micronet .hg-button.hg-selectedBtn {
  background: rgba(0, 122, 255, 0.15) !important;
  color: #007aff !important;
}

.hg-theme-micronet .hg-standardBtn {
  width: auto !important;
}

.hg-theme-micronet .hg-functionBtn {
  width: auto !important;
}
</style>

<style scoped>
.keyboard-container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(245, 243, 239, 0.92);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-top: 0.5px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 -2px 16px rgba(0, 0, 0, 0.06);
  padding: 8px 4px 0;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.keyboard-header {
  display: flex;
  justify-content: flex-end;
  padding: 0 8px 6px;
}

.keyboard-done {
  width: 36px;
  height: 28px;
  border-radius: 14px;
  background: rgba(0, 122, 255, 0.12);
  border: none;
  color: #007aff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.keyboard-done:active {
  background: rgba(0, 122, 255, 0.25);
}

.keyboard-done svg {
  width: 16px;
  height: 16px;
}

.keyboard-body {
  padding: 0 2px;
}

.keyboard-safe-area {
  height: env(safe-area-inset-bottom, 8px);
}

.keyboard-slide-enter-active {
  transition: transform 0.32s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.2s ease;
}

.keyboard-slide-leave-active {
  transition: transform 0.24s cubic-bezier(0.32, 0.72, 0, 1), opacity 0.16s ease;
}

.keyboard-slide-enter-from,
.keyboard-slide-leave-to {
  transform: translateY(100%);
  opacity: 0.5;
}
</style>
