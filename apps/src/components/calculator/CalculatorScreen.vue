<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSwipeGestures } from '@micronet/kernel'
import { useNavigation } from '../../kernel'

const { t } = useI18n()
const { goBack, goHome } = useNavigation()

const { targetRef, isDragging } = useSwipeGestures({
  onSwipeRight: () => goBack(),
})

const { targetRef: barTargetRef } = useSwipeGestures({
  onSwipeUp: () => goHome(),
  threshold: 40,
})

// ─── Calculator State ─────────────────────────────────────────
const display = ref('0')
const previousValue = ref<number | null>(null)
const operation = ref<string | null>(null)
const waitingForOperand = ref(false)
const history = ref<Array<{ expression: string; result: string }>>([])
const showHistory = ref(false)
const isScientific = ref(false)
const memory = ref(0)
const hasMemory = ref(false)
const lastButtonWasEquals = ref(false)
const lastOperand = ref<number | null>(null)
const lastOperation = ref<string | null>(null)

// ─── Display Formatting ───────────────────────────────────────
const displayFormatted = computed(() => {
  const val = display.value
  if (val === 'Error' || val === 'Infinity' || val === '-Infinity' || val === 'NaN') return val === 'NaN' ? 'Error' : val
  if (val.includes('.') && val.endsWith('.')) return formatNumber(val.slice(0, -1)) + '.'
  if (val.includes('.')) {
    const parts = val.split('.')
    return formatNumber(parts[0]) + '.' + parts[1]
  }
  return formatNumber(val)
})

const expressionDisplay = computed(() => {
  if (previousValue.value !== null && operation.value) {
    return `${formatNumber(String(previousValue.value))} ${operation.value}`
  }
  return ''
})

function formatNumber(str: string): string {
  if (str === '' || str === '-' || str === 'Error') return str
  const num = parseFloat(str)
  if (isNaN(num)) return str
  if (Math.abs(num) >= 1e15 || (Math.abs(num) < 1e-10 && num !== 0)) {
    return num.toExponential(8)
  }
  const parts = str.split('.')
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return intPart
}

// ─── Core Calculator Logic ────────────────────────────────────
function inputDigit(digit: string) {
  if (lastButtonWasEquals.value) {
    display.value = digit
    lastButtonWasEquals.value = false
    return
  }
  if (waitingForOperand.value) {
    display.value = digit
    waitingForOperand.value = false
  } else {
    if (display.value === '0' && digit !== '0') {
      display.value = digit
    } else if (display.value === '0' && digit === '0') {
      return
    } else {
      if (display.value.replace(/[^0-9]/g, '').length >= 15) return
      display.value += digit
    }
  }
  lastButtonWasEquals.value = false
}

function inputDecimal() {
  if (lastButtonWasEquals.value) {
    display.value = '0.'
    lastButtonWasEquals.value = false
    return
  }
  if (waitingForOperand.value) {
    display.value = '0.'
    waitingForOperand.value = false
    return
  }
  if (!display.value.includes('.')) {
    display.value += '.'
  }
  lastButtonWasEquals.value = false
}

function performOperation(nextOperation: string) {
  const inputValue = parseFloat(display.value)

  if (lastButtonWasEquals.value && lastOperand.value !== null && lastOperation.value) {
    const result = calculate(inputValue, lastOperand.value, lastOperation.value)
    display.value = String(result)
    previousValue.value = result
    operation.value = nextOperation
    waitingForOperand.value = true
    lastButtonWasEquals.value = false
    return
  }

  if (previousValue.value === null) {
    previousValue.value = inputValue
  } else if (operation.value) {
    const currentValue = previousValue.value
    const result = calculate(currentValue, inputValue, operation.value)
    display.value = String(result)
    previousValue.value = result
  }

  waitingForOperand.value = true
  operation.value = nextOperation
  lastButtonWasEquals.value = false
}

function calculate(left: number, right: number, op: string): number {
  switch (op) {
    case '+': return left + right
    case '-': return left - right
    case '×': return left * right
    case '÷': return right === 0 ? NaN : left / right
    case 'xⁿ': return Math.pow(left, right)
    default: return right
  }
}

function handleEquals() {
  const inputValue = parseFloat(display.value)

  if (lastButtonWasEquals.value && lastOperand.value !== null && lastOperation.value) {
    const result = calculate(inputValue, lastOperand.value, lastOperation.value)
    const expression = `${display.value} ${lastOperation.value} ${formatNumber(String(lastOperand.value))}`
    addToHistory(expression, result)
    display.value = String(result)
    return
  }

  if (previousValue.value === null || operation.value === null) return

  const result = calculate(previousValue.value, inputValue, operation.value)
  const expression = `${formatNumber(String(previousValue.value))} ${operation.value} ${display.value}`

  lastOperand.value = inputValue
  lastOperation.value = operation.value

  addToHistory(expression, result)
  display.value = String(result)
  previousValue.value = null
  operation.value = null
  waitingForOperand.value = false
  lastButtonWasEquals.value = true
}

function addToHistory(expression: string, result: number) {
  const formattedResult = isNaN(result) ? 'Error' : formatNumber(String(result))
  history.value.unshift({ expression, result: formattedResult })
  if (history.value.length > 20) history.value.pop()
}

// ─── Special Functions ────────────────────────────────────────
function clearAll() {
  display.value = '0'
  previousValue.value = null
  operation.value = null
  waitingForOperand.value = false
  lastButtonWasEquals.value = false
  lastOperand.value = null
  lastOperation.value = null
}

function clearEntry() {
  display.value = '0'
  lastButtonWasEquals.value = false
}

function toggleSign() {
  const val = parseFloat(display.value)
  if (val !== 0) {
    display.value = String(-val)
  }
}

function handlePercent() {
  const val = parseFloat(display.value)
  if (previousValue.value !== null && operation.value) {
    display.value = String(previousValue.value * val / 100)
  } else {
    display.value = String(val / 100)
  }
  lastButtonWasEquals.value = false
}

function handleBackspace() {
  if (lastButtonWasEquals.value || waitingForOperand.value) return
  if (display.value.length <= 1 || (display.value.length === 2 && display.value.startsWith('-'))) {
    display.value = '0'
  } else {
    display.value = display.value.slice(0, -1)
  }
}

// ─── Scientific Functions ─────────────────────────────────────
function scientificFn(fn: (x: number) => number) {
  const val = parseFloat(display.value)
  const result = fn(val)
  const expression = `${fn.name}(${display.value})`
  addToHistory(expression, result)
  display.value = isNaN(result) || !isFinite(result) ? 'Error' : String(result)
  lastButtonWasEquals.value = true
}

function handleSin() { scientificFn(Math.sin) }
function handleCos() { scientificFn(Math.cos) }
function handleTan() { scientificFn(Math.tan) }
function handleLog() { scientificFn(Math.log10) }
function handleLn() { scientificFn(Math.log) }
function handleSqrt() { scientificFn(Math.sqrt) }
function handleSquare() {
  const val = parseFloat(display.value)
  const result = val * val
  addToHistory(`${display.value}\u00B2`, result)
  display.value = String(result)
  lastButtonWasEquals.value = true
}
function handleReciprocal() {
  const val = parseFloat(display.value)
  if (val === 0) {
    display.value = 'Error'
    return
  }
  const result = 1 / val
  addToHistory(`1/${display.value}`, result)
  display.value = String(result)
  lastButtonWasEquals.value = true
}
function handlePi() {
  display.value = String(Math.PI)
  lastButtonWasEquals.value = true
}
function handleE() {
  display.value = String(Math.E)
  lastButtonWasEquals.value = true
}
function handleFactorial() {
  const val = parseFloat(display.value)
  if (val < 0 || val !== Math.floor(val) || val > 170) {
    display.value = 'Error'
    return
  }
  let result = 1
  for (let i = 2; i <= val; i++) result *= i
  addToHistory(`${val}!`, result)
  display.value = String(result)
  lastButtonWasEquals.value = true
}
function handlePower() {
  performOperation('xⁿ')
}

// ─── Memory Functions ─────────────────────────────────────────
function memoryAdd() {
  memory.value += parseFloat(display.value) || 0
  hasMemory.value = true
}

function memorySubtract() {
  memory.value -= parseFloat(display.value) || 0
  hasMemory.value = true
}

function memoryRecall() {
  display.value = String(memory.value)
  lastButtonWasEquals.value = true
}

function memoryClear() {
  memory.value = 0
  hasMemory.value = false
}

// ─── History ──────────────────────────────────────────────────
function selectHistoryItem(item: { expression: string; result: string }) {
  display.value = item.result.replace(/,/g, '')
  showHistory.value = false
  lastButtonWasEquals.value = true
}

function clearHistory() {
  history.value = []
}

// ─── Keyboard Support ─────────────────────────────────────────
function handleKeydown(e: KeyboardEvent) {
  if (e.key >= '0' && e.key <= '9') inputDigit(e.key)
  else if (e.key === '.') inputDecimal()
  else if (e.key === '+') performOperation('+')
  else if (e.key === '-') performOperation('-')
  else if (e.key === '*') performOperation('×')
  else if (e.key === '/') { e.preventDefault(); performOperation('÷') }
  else if (e.key === 'Enter' || e.key === '=') handleEquals()
  else if (e.key === 'Escape') clearAll()
  else if (e.key === 'Backspace') handleBackspace()
  else if (e.key === '%') handlePercent()
}

import { onMounted } from 'vue'
onMounted(() => { document.addEventListener('keydown', handleKeydown) })
onUnmounted(() => { document.removeEventListener('keydown', handleKeydown) })
</script>

<template>
  <div :ref="targetRef" class="calculator-screen" :class="{ dragging: isDragging }">
    <div class="wallpaper"></div>

    <div class="content">
      <!-- Header -->
      <div class="header">
        <button class="mode-toggle" @click="isScientific = !isScientific">
          <svg v-if="!isScientific" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" />
          </svg>
        </button>
        <span class="header-title">{{ t('calculator.title') }}</span>
        <button class="history-toggle" @click="showHistory = !showHistory">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <!-- History Panel -->
      <Transition name="slide-down">
        <div v-if="showHistory" class="history-panel">
          <div class="history-header">
            <span class="history-title">{{ t('calculator.history') }}</span>
            <button class="history-clear" @click="clearHistory">{{ t('calculator.clear') }}</button>
          </div>
          <div v-if="history.length === 0" class="history-empty">
            {{ t('calculator.noHistory') }}
          </div>
          <div v-else class="history-list">
            <button
              v-for="(item, i) in history"
              :key="i"
              class="history-item"
              @click="selectHistoryItem(item)"
            >
              <span class="history-expression">{{ item.expression }}</span>
              <span class="history-result">= {{ item.result }}</span>
            </button>
          </div>
        </div>
      </Transition>

      <!-- Display -->
      <div class="display-section">
        <div class="expression">{{ expressionDisplay }}</div>
        <div class="display-value" :class="{ small: displayFormatted.length > 10 }">
          {{ displayFormatted }}
        </div>
        <div class="display-indicators">
          <span v-if="hasMemory" class="indicator memory-indicator">M</span>
        </div>
      </div>

      <!-- Scientific Buttons -->
      <Transition name="fade">
        <div v-if="isScientific" class="scientific-grid">
          <button class="btn btn-sci" @click="handleSin">sin</button>
          <button class="btn btn-sci" @click="handleCos">cos</button>
          <button class="btn btn-sci" @click="handleTan">tan</button>
          <button class="btn btn-sci" @click="handleLog">log</button>
          <button class="btn btn-sci" @click="handleLn">ln</button>
          <button class="btn btn-sci" @click="handleSqrt">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
              <path d="M3 20h4l8-16h4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
          <button class="btn btn-sci" @click="handleSquare">x&sup2;</button>
          <button class="btn btn-sci" @click="handlePower">x&#739;</button>
          <button class="btn btn-sci" @click="handleReciprocal">1/x</button>
          <button class="btn btn-sci" @click="handleFactorial">x!</button>
          <button class="btn btn-sci" @click="handlePi">&pi;</button>
          <button class="btn btn-sci" @click="handleE">e</button>
          <button class="btn btn-sci" @click="memoryClear">MC</button>
          <button class="btn btn-sci" @click="memoryRecall">MR</button>
          <button class="btn btn-sci" @click="memoryAdd">M+</button>
          <button class="btn btn-sci" @click="memorySubtract">M-</button>
        </div>
      </Transition>

      <!-- Standard Buttons -->
      <div class="button-grid">
        <button class="btn btn-function" @click="operation ? clearEntry() : clearAll()">
          {{ operation ? 'C' : 'AC' }}
        </button>
        <button class="btn btn-function" @click="toggleSign">+/&minus;</button>
        <button class="btn btn-function" @click="handlePercent">%</button>
        <button class="btn btn-operator" :class="{ active: operation === '÷' }" @click="performOperation('÷')">&divide;</button>

        <button class="btn btn-digit" @click="inputDigit('7')">7</button>
        <button class="btn btn-digit" @click="inputDigit('8')">8</button>
        <button class="btn btn-digit" @click="inputDigit('9')">9</button>
        <button class="btn btn-operator" :class="{ active: operation === '×' }" @click="performOperation('×')">&times;</button>

        <button class="btn btn-digit" @click="inputDigit('4')">4</button>
        <button class="btn btn-digit" @click="inputDigit('5')">5</button>
        <button class="btn btn-digit" @click="inputDigit('6')">6</button>
        <button class="btn btn-operator" :class="{ active: operation === '-' }" @click="performOperation('-')">&minus;</button>

        <button class="btn btn-digit" @click="inputDigit('1')">1</button>
        <button class="btn btn-digit" @click="inputDigit('2')">2</button>
        <button class="btn btn-digit" @click="inputDigit('3')">3</button>
        <button class="btn btn-operator" :class="{ active: operation === '+' }" @click="performOperation('+')">+</button>

        <button class="btn btn-digit btn-wide" @click="inputDigit('0')">0</button>
        <button class="btn btn-digit" @click="inputDecimal">.</button>
        <button class="btn btn-equals" @click="handleEquals">=</button>
      </div>

      <!-- Home Bar -->
      <div :ref="barTargetRef" class="home-bar-area">
        <div class="home-bar"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calculator-screen {
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
  background: linear-gradient(180deg, #1a1a1a 0%, #0a0a0a 100%);
}

.content {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 0 44px;
}

/* ─── Header ─────────────────────────────────────────────────── */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top, 8px) + 4px) 16px 8px;
  flex-shrink: 0;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.2px;
}

.mode-toggle,
.history-toggle {
  width: 36px;
  height: 36px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease;
}

.mode-toggle:active,
.history-toggle:active {
  background: rgba(255, 255, 255, 0.2);
}

.mode-toggle svg,
.history-toggle svg {
  width: 18px;
  height: 18px;
}

/* ─── History Panel ──────────────────────────────────────────── */
.history-panel {
  background: rgba(30, 30, 30, 0.95);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 0.5px solid rgba(255, 255, 255, 0.08);
  max-height: 200px;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
}

.history-title {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.history-clear {
  font-size: 13px;
  color: #007aff;
  background: none;
  border: none;
  cursor: pointer;
}

.history-empty {
  padding: 16px;
  text-align: center;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.3);
}

.history-list {
  padding: 0 8px 8px;
}

.history-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  width: 100%;
  padding: 8px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s ease;
}

.history-item:active {
  background: rgba(255, 255, 255, 0.08);
}

.history-expression {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
}

.history-result {
  font-size: 17px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
}

/* ─── Display ────────────────────────────────────────────────── */
.display-section {
  flex-shrink: 0;
  padding: 8px 24px 12px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  min-height: 100px;
  justify-content: flex-end;
}

.expression {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.4);
  min-height: 20px;
  letter-spacing: 0.3px;
}

.display-value {
  font-size: 56px;
  font-weight: 300;
  color: #ffffff;
  letter-spacing: -1px;
  line-height: 1.1;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: font-size 0.15s ease;
}

.display-value.small {
  font-size: 38px;
}

.display-indicators {
  display: flex;
  gap: 6px;
  min-height: 18px;
  margin-top: 4px;
}

.indicator {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
}

/* ─── Scientific Grid ────────────────────────────────────────── */
.scientific-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 0 12px 8px;
  flex-shrink: 0;
}

/* ─── Button Grid ────────────────────────────────────────────── */
.button-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 0 12px;
  flex: 1;
  align-content: end;
}

.btn {
  border: none;
  border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
  font-size: 22px;
  font-weight: 400;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.08s ease, transform 0.08s ease;
  -webkit-tap-highlight-color: transparent;
  position: relative;
  overflow: hidden;
  min-height: 48px;
}

.btn:active {
  transform: scale(0.95);
}

.btn-icon {
  width: 22px;
  height: 22px;
}

/* Digit buttons */
.btn-digit {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.btn-digit:active {
  background: rgba(255, 255, 255, 0.22);
}

.btn-wide {
  grid-column: span 2;
  border-radius: 12px;
  justify-content: flex-start;
  padding-left: 24px;
}

/* Function buttons (AC, +/-, %) */
.btn-function {
  background: rgba(180, 185, 195, 0.65);
  color: #1a1a1a;
  font-size: 18px;
}

.btn-function:active {
  background: rgba(160, 165, 175, 0.75);
}

/* Operator buttons */
.btn-operator {
  background: #ff9f0a;
  color: #ffffff;
  font-size: 26px;
  font-weight: 500;
}

.btn-operator:active {
  background: #e68a00;
}

.btn-operator.active {
  background: #ffffff;
  color: #ff9f0a;
}

/* Equals button */
.btn-equals {
  background: #007aff;
  color: #ffffff;
  font-size: 26px;
  font-weight: 500;
}

.btn-equals:active {
  background: #0066d6;
}

/* Scientific buttons */
.btn-sci {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: 500;
  min-height: 38px;
  border-radius: 8px;
}

.btn-sci:active {
  background: rgba(255, 255, 255, 0.15);
}

/* ─── Home Bar ──────────────────────────────────────────────── */
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
  height: 5px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
}

/* ─── Transitions ────────────────────────────────────────────── */
.slide-down-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.slide-down-leave-active {
  transition: all 0.2s ease-in;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active {
  transition: all 0.2s ease;
}

.fade-leave-active {
  transition: all 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  max-height: 0;
}

/* ─── Responsive ─────────────────────────────────────────────── */
@media (max-height: 600px) {
  .display-section {
    min-height: 70px;
    padding: 4px 20px 8px;
  }

  .display-value {
    font-size: 42px;
  }

  .display-value.small {
    font-size: 30px;
  }

  .button-grid {
    gap: 6px;
  }

  .btn {
    min-height: 42px;
    font-size: 20px;
  }

  .scientific-grid {
    gap: 6px;
  }

  .btn-sci {
    min-height: 34px;
    font-size: 13px;
  }
}
</style>
