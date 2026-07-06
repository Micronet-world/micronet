<script setup lang="ts">
import StatusBar from '../StatusBar.vue'
import { ref, computed } from 'vue'
import { useSwipeGestures } from 'micronet-kernel'
import { useBluetooth } from 'micronet-kernel'
import type { BTDevice, BTCharacteristic } from 'micronet-kernel'
import { useI18n } from 'vue-i18n'

import { setLocale, getLocale } from 'micronet-kernel'
import { useNavigation } from '../../kernel'

const { t } = useI18n()
const { lock, goBack, goHome } = useNavigation()

// --- Swipe gesture ---
const settingsBody = ref<HTMLElement | null>(null)

const canSwipeDown = () => {
  const el = settingsBody.value
  return !el || el.scrollTop <= 0
}

// pageHistory is declared below; forward-declare navigateBack
let navigateBackFn: () => void

const { targetRef, dragProgress, swipeDirection, isDragging } =
  useSwipeGestures({
    onSwipeDown: () => lock(),
    onSwipeUp: () => goHome(),
    onSwipeRight: () => {
      if (navigateBackFn) navigateBackFn()
    },
    canSwipeVertical: () => {
      if (swipeDirection.value === 'down') return canSwipeDown()
      return true
    },
  })

// --- State ---
const airplaneMode = ref(false)
const wifiEnabled = ref(true)
const bluetoothEnabled = ref(true)
const darkMode = ref(false)
const notifications = ref(true)
const locationServices = ref(true)
const autoBrightness = ref(true)
const brightness = ref(60)
const fontSize = ref<'small' | 'default' | 'large'>('default')

const LOCALES = ['en', 'zh'] as const
function cycleLocale() {
  const cur = getLocale()
  const idx = LOCALES.indexOf(cur)
  const next = LOCALES[(idx + 1) % LOCALES.length]
  setLocale(next)
}

// --- Navigation ---
type Page = 'main' | 'wifi' | 'bluetooth' | 'bluetooth-device' | 'display' | 'notifications' | 'privacy' | 'about'
const currentPage = ref<Page>('main')
const pageHistory = ref<Page[]>([])
const pageDirection = ref<'forward' | 'back'>('forward')

const navigateTo = (page: Page) => {
  pageDirection.value = 'forward'
  pageHistory.value.push(currentPage.value)
  currentPage.value = page
}

const navigateBack = () => {
  if (pageHistory.value.length > 0) {
    pageDirection.value = 'back'
    currentPage.value = pageHistory.value.pop()!
  } else {
    goBack()
  }
}

navigateBackFn = navigateBack

// --- Search ---
const searchQuery = ref('')

interface SettingsItem {
  labelKey: string
  keywords: string[]
  page: Page
  action?: 'cycleLocale'
}

const settingsItems: SettingsItem[] = [
  { labelKey: 'settings.airplaneMode', keywords: ['airplane', 'flight', 'mode', '飞行'], page: 'main' },
  { labelKey: 'settings.wifi', keywords: ['wifi', 'wi-fi', 'wireless', 'network', 'internet', '无线', '网络'], page: 'wifi' },
  { labelKey: 'settings.bluetooth', keywords: ['bluetooth', 'wireless', 'pair', 'device', '蓝牙', '配对'], page: 'bluetooth' },
  { labelKey: 'settings.displayBrightness', keywords: ['display', 'brightness', 'dark mode', 'screen', 'text', 'font', 'true tone', '显示', '亮度', '深色'], page: 'display' },
  { labelKey: 'settings.language', keywords: ['language', 'locale', 'english', 'chinese', '语言', '中文', '英文'], page: 'main' as Page, action: 'cycleLocale' },
  { labelKey: 'settings.notifications', keywords: ['notifications', 'alerts', 'messages', 'mail', 'calendar', 'photos', 'banner', '通知', '消息'], page: 'notifications' },
  { labelKey: 'settings.privacySecurity', keywords: ['privacy', 'security', 'location', 'face id', 'passcode', 'lock', '隐私', '安全', '定位'], page: 'privacy' },
  { labelKey: 'settings.about', keywords: ['about', 'model', 'version', 'storage', 'device', 'info', '关于', '型号', '版本', '存储'], page: 'about' },
]

const filteredItems = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return []
  return settingsItems.filter(item => {
    const label = t(item.labelKey).toLowerCase()
    return label.includes(q) || item.keywords.some(k => k.includes(q))
  })
})

const handleSearchResultClick = (item: SettingsItem) => {
  if (item.action === 'cycleLocale') {
    cycleLocale()
  } else if (item.page === 'main') {
    airplaneMode.value = !airplaneMode.value
  } else {
    navigateTo(item.page)
  }
  searchQuery.value = ''
}

// --- WiFi ---
const selectedWifi = ref('Home Network')
const wifiNetworks = [
  { name: 'Home Network', secured: true, connected: true, signal: 3 },
  { name: 'Office_5G', secured: true, connected: false, signal: 3 },
  { name: 'Coffee Shop', secured: false, connected: false, signal: 2 },
  { name: 'Neighbor_Network', secured: true, connected: false, signal: 1 },
]

// --- Bluetooth ---
const {
  isSupported: btSupported,
  isScanning: btScanning,
  pairedDevices: btPaired,
  discoveredDevices: btDiscovered,
  selectedDevice: btSelectedDevice,
  error: btError,
  requestDevice: btRequestDevice,
  connect: btConnect,
  disconnect: btDisconnect,
  discoverServices: btDiscoverServices,
  readCharacteristic: btReadChar,
  writeCharacteristic: btWriteChar,
  startNotifications: btStartNotify,
  stopNotifications: btStopNotify,
  removeDevice: btRemoveDevice,
  selectDevice: btSelectDevice,
} = useBluetooth()

// Characteristic detail state
const selectedChar = ref<BTCharacteristic | null>(null)
const charValue = ref<string>('')
const charWriteInput = ref('')
const charNotifying = ref(false)
const btActionLoading = ref(false)

async function handleScan() {
  const dev = await btRequestDevice()
  if (dev) {
    await btConnect(dev)
    btSelectDevice(dev)
    selectedChar.value = null
    charValue.value = ''
    navigateTo('bluetooth-device')
  }
}

async function handleDeviceTap(dev: BTDevice) {
  btSelectDevice(dev)
  selectedChar.value = null
  charValue.value = ''

  if (dev.connected) {
    await btDiscoverServices(dev)
    navigateTo('bluetooth-device')
  } else {
    await btConnect(dev)
    if (dev.connected) {
      await btDiscoverServices(dev)
      navigateTo('bluetooth-device')
    }
  }
}

async function handleDisconnect() {
  if (btSelectedDevice.value) {
    await btDisconnect(btSelectedDevice.value)
  }
}

async function handleForgetDevice() {
  if (btSelectedDevice.value) {
    btRemoveDevice(btSelectedDevice.value)
    navigateBack()
  }
}

async function handleReadChar(char: BTCharacteristic) {
  if (!btSelectedDevice.value) return
  btActionLoading.value = true
  const val = await btReadChar(btSelectedDevice.value, char)
  if (val) {
    charValue.value = formatDataView(val)
    selectedChar.value = char
  }
  btActionLoading.value = false
}

async function handleToggleNotify(char: BTCharacteristic) {
  if (!btSelectedDevice.value) return
  btActionLoading.value = true
  if (char.notifying) {
    await btStopNotify(btSelectedDevice.value, char)
    charNotifying.value = false
  } else {
    await btStartNotify(btSelectedDevice.value, char, (val) => {
      charValue.value = formatDataView(val)
    })
    charNotifying.value = true
  }
  btActionLoading.value = false
}

async function handleWriteChar(char: BTCharacteristic) {
  if (!btSelectedDevice.value || !charWriteInput.value) return
  btActionLoading.value = true
  const encoder = new TextEncoder()
  const data = encoder.encode(charWriteInput.value).buffer
  await btWriteChar(btSelectedDevice.value, char, data)
  btActionLoading.value = false
  charWriteInput.value = ''
}

function handleCharTap(char: BTCharacteristic) {
  selectedChar.value = char
  charValue.value = ''
  charWriteInput.value = ''
}

function formatDataView(dv: DataView): string {
  const bytes = Array.from(new Uint8Array(dv.buffer))
  const hex = bytes.map(b => b.toString(16).padStart(2, '0')).join(' ')
  const ascii = bytes.map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('')
  return `${hex}\n${ascii}`
}

function formatCharProps(char: BTCharacteristic): string {
  const props: string[] = []
  if (char.properties.read) props.push('Read')
  if (char.properties.write) props.push('Write')
  if (char.properties.writeWithoutResponse) props.push('WriteNoResp')
  if (char.properties.notify) props.push('Notify')
  if (char.properties.indicate) props.push('Indicate')
  return props.join(', ')
}

const unpairedDiscovered = computed(() => {
  const pairedIds = new Set(btPaired.value.map(d => d.id))
  return btDiscovered.value.filter(d => !pairedIds.has(d.id))
})

// --- About ---
const deviceInfo = {
  name: 'iPhone',
  model: 'Mobile Prototype',
  os: 'iOS 18.0',
  version: '1.0.0',
  storage: '128 GB',
  storageUsed: '47.3 GB',
}
</script>

<template>
  <div
    :ref="targetRef"
    class="settings-screen"
    :class="{ dragging: isDragging }"
  >
    <div class="wallpaper"></div>
    <div
      class="content"
      :style="{
        transform: swipeDirection === 'right'
          ? `translateX(${dragProgress * 40}px)`
          : `translateY(${swipeDirection === 'down' && canSwipeDown() ? dragProgress * 30 : 0}px)`,
        opacity: 1 - (swipeDirection ? dragProgress * 0.2 : 0),
      }"
    >
      <StatusBar />

      <!-- Header -->
      <div class="settings-header">
        <div class="header-title">
          <h1 v-if="currentPage === 'main'">{{ t('settings.title') }}</h1>
          <h1 v-else-if="currentPage === 'wifi'">{{ t('settings.wifi') }}</h1>
          <h1 v-else-if="currentPage === 'bluetooth'">{{ t('settings.bluetooth') }}</h1>
          <h1 v-else-if="currentPage === 'display'">{{ t('settings.displayBrightness') }}</h1>
          <h1 v-else-if="currentPage === 'notifications'">{{ t('settings.notifications') }}</h1>
          <h1 v-else-if="currentPage === 'privacy'">{{ t('settings.privacySecurity') }}</h1>
          <h1 v-else-if="currentPage === 'about'">{{ t('settings.about') }}</h1>
        </div>
      </div>

      <!-- Scrollable content -->
      <div ref="settingsBody" class="settings-body">
        <Transition :name="pageDirection === 'forward' ? 'slide-left' : 'slide-right'" mode="out-in">

          <!-- Main page -->
          <div v-if="currentPage === 'main'" key="main" class="page">
            <!-- Search bar -->
            <div class="search-bar" :class="{ focused: searchQuery.length > 0 }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                class="search-input"
                placeholder="Search"
                v-model="searchQuery"
              />
              <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10" fill="rgba(0,0,0,0.15)"/>
                  <path d="M15.59 7L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41z" fill="white"/>
                </svg>
              </button>
            </div>

            <!-- Search results -->
            <template v-if="searchQuery">
              <div v-if="filteredItems.length > 0" class="settings-group search-results">
                <div
                  v-for="item in filteredItems"
                  :key="item.labelKey"
                  class="settings-row"
                  @click="handleSearchResultClick(item)"
                >
                  <span class="row-label">{{ t(item.labelKey) }}</span>
                  <svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
              <div v-else class="no-results">
                {{ t('settings.noResults') }}
              </div>
            </template>

            <!-- Normal settings list (hidden during search) -->
            <template v-else>
              <!-- Airplane / Wi-Fi / Bluetooth -->
              <div class="settings-group stagger-1">
                <div class="settings-row" @click="airplaneMode = !airplaneMode">
                  <div class="row-icon airplane-icon" :class="{ active: airplaneMode }">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 2L11 13"/>
                      <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
                    </svg>
                  </div>
                  <span class="row-label">{{ t('settings.airplaneMode') }}</span>
                  <label class="toggle" @click.stop>
                    <input type="checkbox" v-model="airplaneMode" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="settings-row" @click="navigateTo('wifi')">
                  <div class="row-icon wifi-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
                      <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
                      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                      <circle cx="12" cy="20" r="1"/>
                    </svg>
                  </div>
                  <span class="row-label">{{ t('settings.wifi') }}</span>
                  <span class="row-value">{{ wifiEnabled ? selectedWifi : t('common.off') }}</span>
                  <svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
                <div class="settings-row" @click="navigateTo('bluetooth')">
                  <div class="row-icon bluetooth-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"/>
                    </svg>
                  </div>
                  <span class="row-label">{{ t('settings.bluetooth') }}</span>
                  <span class="row-value">{{ bluetoothEnabled ? t('common.on') : t('common.off') }}</span>
                  <svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <!-- Display / Notifications -->
              <div class="settings-group stagger-2">
                <div class="settings-row" @click="navigateTo('display')">
                  <div class="row-icon display-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="5"/>
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                    </svg>
                  </div>
                  <span class="row-label">{{ t('settings.displayBrightness') }}</span>
                  <svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
                <div class="settings-row" @click="navigateTo('notifications')">
                  <div class="row-icon notifications-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                  </div>
                  <span class="row-label">{{ t('settings.notifications') }}</span>
                  <svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
                <div class="settings-row" @click="navigateTo('privacy')">
                  <div class="row-icon privacy-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </div>
                  <span class="row-label">{{ t('settings.privacySecurity') }}</span>
                  <svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <!-- Language & About -->
              <div class="settings-group stagger-3">
                <div class="settings-row" @click="cycleLocale">
                  <div class="row-icon language-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </div>
                  <span class="row-label">{{ t('settings.language') }}</span>
                  <span class="row-value">{{ t('settings.languageName') }}</span>
                  <svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
                <div class="settings-row" @click="navigateTo('about')">
                  <div class="row-icon about-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 16v-4M12 8h.01"/>
                    </svg>
                  </div>
                  <span class="row-label">{{ t('settings.about') }}</span>
                  <svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
            </template>
          </div>

          <!-- Wi-Fi page -->
          <div v-else-if="currentPage === 'wifi'" key="wifi" class="page">
            <div class="settings-group">
              <div class="settings-row">
                <span class="row-label">{{ t('settings.wifi') }}</span>
                <label class="toggle" @click.stop>
                  <input type="checkbox" v-model="wifiEnabled" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            <template v-if="wifiEnabled">
              <div class="group-header">{{ t('settings.chooseNetwork') }}</div>
              <div class="settings-group">
                <div
                  v-for="(network, i) in wifiNetworks"
                  :key="network.name"
                  class="settings-row"
                  :style="{ animationDelay: `${i * 50}ms` }"
                  @click="selectedWifi = network.name"
                >
                  <div class="row-icon-small">
                    <svg viewBox="0 0 24 24" fill="none" :stroke="network.signal >= 2 ? 'currentColor' : '#999'" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path v-if="network.signal >= 3" d="M5 12.55a11 11 0 0 1 14.08 0"/>
                      <path v-if="network.signal >= 2" d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
                      <circle cx="12" cy="20" r="1"/>
                      <path v-if="network.signal >= 1" d="M1.42 9a16 16 0 0 1 21.16 0"/>
                    </svg>
                  </div>
                  <span class="row-label">{{ network.name }}</span>
                  <div class="row-end">
                    <svg v-if="network.secured" class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <svg v-if="selectedWifi === network.name" class="checkmark" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    <svg v-else class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </div>
              </div>
              <div class="group-header">{{ t('settings.otherNetworks') }}</div>
              <div class="settings-group">
                <div class="settings-row">
                  <span class="row-label" style="color: var(--color-text-secondary)">{{ t('settings.askToJoinNetworks') }}</span>
                  <label class="toggle" @click.stop>
                    <input type="checkbox" checked disabled />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </template>
          </div>

          <!-- Bluetooth page -->
          <div v-else-if="currentPage === 'bluetooth'" key="bluetooth" class="page">
            <div class="settings-group">
              <div class="settings-row">
                <span class="row-label">{{ t('settings.bluetooth') }}</span>
                <label class="toggle" @click.stop>
                  <input type="checkbox" v-model="bluetoothEnabled" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            <template v-if="bluetoothEnabled">
              <!-- Scan button -->
              <div class="settings-group">
                <div class="settings-row" @click="handleScan" :class="{ disabled: btScanning || !btSupported }">
                  <div class="row-icon-small">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/>
                      <path d="M5 19.5C5.5 18 6 15 6 12c0-.7.12-1.37.34-2"/>
                      <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/>
                      <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/>
                      <path d="M8.65 22c.21-.66.45-1.32.57-2"/>
                      <path d="M14 13.12c0 2.38 0 6.38-1 8.88"/>
                      <path d="M2 16h.01"/>
                      <path d="M21.8 16c.2-2 .131-5.354 0-6"/>
                      <path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2"/>
                    </svg>
                  </div>
                  <span class="row-label">{{ btScanning ? t('settings.scanning') : t('settings.scanForDevices') }}</span>
                  <span v-if="btScanning" class="row-value">
                    <span class="spinner"></span>
                  </span>
                  <svg v-else class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>

              <!-- Error message -->
              <div v-if="btError" class="bt-error">{{ btError }}</div>

              <!-- Not supported warning -->
              <div v-if="!btSupported" class="bt-warning">
                {{ t('settings.btNotSupported') }}
              </div>

              <!-- Paired Devices -->
              <template v-if="btPaired.length > 0">
                <div class="group-header">{{ t('settings.myDevices') }}</div>
                <div class="settings-group">
                  <div v-for="(device, i) in btPaired" :key="device.id" class="settings-row" :style="{ animationDelay: `${i * 60}ms` }" @click="handleDeviceTap(device)">
                    <div class="row-icon-small">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"/>
                      </svg>
                    </div>
                    <span class="row-label">{{ device.name }}</span>
                    <span class="row-value" :class="{ connected: device.connected }">
                      <span v-if="device.connected" class="connected-dot"></span>
                      {{ device.connected ? t('settings.connected') : t('settings.notConnected') }}
                    </span>
                    <svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </div>
              </template>

              <!-- Discovered Devices (not in paired) -->
              <template v-if="unpairedDiscovered.length > 0">
                <div class="group-header">{{ t('settings.otherDevices') }}</div>
                <div class="settings-group">
                  <div v-for="(device, i) in unpairedDiscovered" :key="device.id" class="settings-row" :style="{ animationDelay: `${i * 60}ms` }" @click="handleDeviceTap(device)">
                    <div class="row-icon-small">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"/>
                      </svg>
                    </div>
                    <span class="row-label">{{ device.name }}</span>
                    <span class="row-value">{{ device.connected ? t('settings.connected') : '' }}</span>
                    <svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </div>
              </template>

              <!-- Empty state when no devices -->
              <div v-if="btPaired.length === 0 && unpairedDiscovered.length === 0 && !btScanning" class="bt-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M6.5 6.5l11 11L12 23V1l5.5 5.5-11 11"/>
                </svg>
                <p>{{ t('settings.noDevices') }}</p>
                <span>{{ t('settings.scanForDevices') }}</span>
              </div>
            </template>
          </div>

          <!-- Bluetooth Device Detail page -->
          <div v-else-if="currentPage === 'bluetooth-device'" key="bluetooth-device" class="page">
            <template v-if="btSelectedDevice">
              <!-- Connection status -->
              <div class="settings-group">
                <div class="settings-row">
                  <span class="row-label">{{ btSelectedDevice.name }}</span>
                  <span class="row-value" :class="{ connected: btSelectedDevice.connected }">
                    <span v-if="btSelectedDevice.connected" class="connected-dot"></span>
                    {{ btSelectedDevice.connected ? t('settings.connected') : t('settings.disconnected') }}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="settings-group">
                <div v-if="btSelectedDevice.connected" class="settings-row" @click="handleDisconnect">
                  <span class="row-label" style="color: var(--color-danger)">{{ t('common.disconnect') }}</span>
                </div>
                <div v-else class="settings-row" @click="handleDeviceTap(btSelectedDevice)">
                  <span class="row-label" style="color: var(--color-accent)">{{ t('common.connect') }}</span>
                </div>
                <div class="settings-row" @click="handleForgetDevice">
                  <span class="row-label" style="color: var(--color-danger)">{{ t('settings.forgetThisDevice') }}</span>
                </div>
              </div>

              <!-- Services -->
              <template v-if="btSelectedDevice.connected && btSelectedDevice.services.length > 0">
                <template v-for="service in btSelectedDevice.services" :key="service.uuid">
                  <div class="group-header">{{ service.name }}</div>
                  <div class="settings-group">
                    <div v-for="char in service.characteristics" :key="char.uuid"
                      class="settings-row column"
                      :class="{ 'char-selected': selectedChar?.uuid === char.uuid }"
                      @click="handleCharTap(char)">
                      <div class="char-header">
                        <span class="row-label char-name">{{ char.name }}</span>
                        <span class="char-props">{{ formatCharProps(char) }}</span>
                      </div>
                      <div class="char-uuid">{{ char.uuid }}</div>
                      <div v-if="selectedChar?.uuid === char.uuid" class="char-actions">
                        <!-- Read button -->
                        <button v-if="char.properties.read" class="char-btn" @click.stop="handleReadChar(char)" :disabled="btActionLoading">
                          {{ t('common.read') }}
                        </button>
                        <!-- Notify toggle -->
                        <button v-if="char.properties.notify || char.properties.indicate" class="char-btn" :class="{ active: char.notifying }" @click.stop="handleToggleNotify(char)" :disabled="btActionLoading">
                          {{ char.notifying ? t('common.stopNotify') : t('common.notify') }}
                        </button>
                        <!-- Write input -->
                        <div v-if="char.properties.write || char.properties.writeWithoutResponse" class="char-write">
                          <input type="text" v-model="charWriteInput" :placeholder="t('settings.valueToWrite')" class="char-write-input" @click.stop />
                          <button class="char-btn" @click.stop="handleWriteChar(char)" :disabled="btActionLoading || !charWriteInput">
                            {{ t('common.write') }}
                          </button>
                        </div>
                        <!-- Value display -->
                        <div v-if="charValue" class="char-value">
                          <pre>{{ charValue }}</pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </template>

              <!-- Loading state -->
              <div v-if="btSelectedDevice.connected && btSelectedDevice.services.length === 0" class="bt-empty">
                <span class="spinner"></span>
                <p>{{ t('settings.discoveringServices') }}</p>
              </div>
            </template>
          </div>

          <!-- Display & Brightness page -->
          <div v-else-if="currentPage === 'display'" key="display" class="page">
            <div class="settings-group">
              <div class="settings-row">
                <span class="row-label">{{ t('settings.darkMode') }}</span>
                <label class="toggle" @click.stop>
                  <input type="checkbox" v-model="darkMode" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="settings-row">
                <span class="row-label">{{ t('settings.trueTone') }}</span>
                <label class="toggle" @click.stop>
                  <input type="checkbox" checked />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="settings-row">
                <span class="row-label">{{ t('settings.autoBrightness') }}</span>
                <label class="toggle" @click.stop>
                  <input type="checkbox" v-model="autoBrightness" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div class="group-header">{{ t('settings.brightness') }}</div>
            <div class="settings-group slider-group">
              <div class="slider-row">
                <svg class="slider-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2"/>
                </svg>
                <div class="slider-track">
                  <div class="slider-fill" :style="{ width: brightness + '%' }"></div>
                  <input type="range" min="0" max="100" v-model.number="brightness" class="slider" />
                </div>
                <svg class="slider-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M12 6v12M6 12h12"/>
                </svg>
              </div>
            </div>

            <div class="group-header">{{ t('settings.textSize') }}</div>
            <div class="settings-group">
              <div class="font-size-picker">
                <button
                  v-for="size in (['small', 'default', 'large'] as const)"
                  :key="size"
                  class="font-size-btn"
                  :class="{ active: fontSize === size }"
                  @click="fontSize = size"
                >
                  <span :style="{ fontSize: size === 'small' ? '13px' : size === 'large' ? '20px' : '16px' }">Aa</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Notifications page -->
          <div v-else-if="currentPage === 'notifications'" key="notifications" class="page">
            <div class="settings-group">
              <div class="settings-row">
                <span class="row-label">{{ t('settings.allowNotifications') }}</span>
                <label class="toggle" @click.stop>
                  <input type="checkbox" v-model="notifications" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            <template v-if="notifications">
              <div class="group-header">{{ t('settings.notificationStyle') }}</div>
              <div class="settings-group">
                <div class="settings-row">
                  <span class="row-label">{{ t('settings.showPreviews') }}</span>
                  <span class="row-value">{{ t('settings.always') }}</span>
                  <svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
                <div class="settings-row">
                  <span class="row-label">{{ t('settings.scheduledSummary') }}</span>
                  <label class="toggle" @click.stop>
                    <input type="checkbox" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
              <div class="group-header">{{ t('settings.appNotifications') }}</div>
              <div class="settings-group">
                <div class="settings-row">
                  <div class="row-icon-small app-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <span class="row-label">{{ t('settings.messages') }}</span>
                  <label class="toggle" @click.stop>
                    <input type="checkbox" checked />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="settings-row">
                  <div class="row-icon-small app-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2"/>
                      <path d="M22 4l-10 8L2 4"/>
                    </svg>
                  </div>
                  <span class="row-label">{{ t('settings.mail') }}</span>
                  <label class="toggle" @click.stop>
                    <input type="checkbox" checked />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="settings-row">
                  <div class="row-icon-small app-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <path d="M16 2v4M8 2v4M3 10h18"/>
                      <circle cx="12" cy="16" r="1"/>
                    </svg>
                  </div>
                  <span class="row-label">{{ t('settings.calendar') }}</span>
                  <label class="toggle" @click.stop>
                    <input type="checkbox" checked />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
                <div class="settings-row">
                  <div class="row-icon-small app-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-5-5L5 21"/>
                    </svg>
                  </div>
                  <span class="row-label">{{ t('photos.title') }}</span>
                  <label class="toggle" @click.stop>
                    <input type="checkbox" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </template>
          </div>

          <!-- Privacy & Security page -->
          <div v-else-if="currentPage === 'privacy'" key="privacy" class="page">
            <div class="settings-group">
              <div class="settings-row">
                <span class="row-label">{{ t('settings.locationServices') }}</span>
                <label class="toggle" @click.stop>
                  <input type="checkbox" v-model="locationServices" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </div>
            <template v-if="locationServices">
              <div class="group-header">{{ t('settings.locationAccess') }}</div>
              <div class="settings-group">
                <div class="settings-row">
                  <div class="row-icon-small app-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <span class="row-label">{{ t('settings.maps') }}</span>
                  <span class="row-value">{{ t('settings.whileUsing') }}</span>
                  <svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
                <div class="settings-row">
                  <div class="row-icon-small app-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                  <span class="row-label">{{ t('home.camera') }}</span>
                  <span class="row-value">{{ t('settings.never') }}</span>
                  <svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
            </template>
            <div class="group-header">{{ t('settings.security') }}</div>
            <div class="settings-group">
              <div class="settings-row">
                <span class="row-label">{{ t('settings.faceId') }}</span>
                <span class="row-value">{{ t('common.on') }}</span>
                <svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
              <div class="settings-row">
                <span class="row-label">{{ t('settings.passcode') }}</span>
                <span class="row-value">{{ t('common.on') }}</span>
                <svg class="row-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </div>
          </div>

          <!-- About page -->
          <div v-else-if="currentPage === 'about'" key="about" class="page">
            <div class="settings-group">
              <div class="settings-row">
                <span class="row-label">{{ t('settings.name') }}</span>
                <span class="row-value">{{ deviceInfo.name }}</span>
              </div>
              <div class="settings-row">
                <span class="row-label">{{ t('settings.model') }}</span>
                <span class="row-value">{{ deviceInfo.model }}</span>
              </div>
              <div class="settings-row">
                <span class="row-label">{{ t('settings.os') }}</span>
                <span class="row-value">{{ deviceInfo.os }}</span>
              </div>
              <div class="settings-row">
                <span class="row-label">{{ t('settings.version') }}</span>
                <span class="row-value">{{ deviceInfo.version }}</span>
              </div>
            </div>
            <div class="group-header">{{ t('settings.storage') }}</div>
            <div class="settings-group">
              <div class="settings-row column">
                <div class="storage-header">
                  <span class="row-label">{{ t('settings.storage') }}</span>
                  <span class="row-value">{{ t('settings.storageUsed', { used: deviceInfo.storageUsed, total: deviceInfo.storage }) }}</span>
                </div>
                <div class="storage-bar">
                  <div class="storage-used" :style="{ width: '37%' }"></div>
                </div>
              </div>
            </div>
          </div>

        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* === Page transitions === */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-left-enter-from {
  transform: translateX(40%);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-20%);
  opacity: 0;
}

.slide-right-enter-from {
  transform: translateX(-40%);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(20%);
  opacity: 0;
}

/* === Staggered entry animations === */
@keyframes group-enter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes row-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page .stagger-1 { animation: group-enter 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; animation-delay: 0ms; }
.page .stagger-2 { animation: group-enter 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; animation-delay: 80ms; }
.page .stagger-3 { animation: group-enter 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; animation-delay: 160ms; }

.page .settings-group:not(.stagger-1):not(.stagger-2):not(.stagger-3) {
  animation: group-enter 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

.page .settings-group .settings-row {
  animation: row-enter 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

.page .settings-group .settings-row:nth-child(1) { animation-delay: 40ms; }
.page .settings-group .settings-row:nth-child(2) { animation-delay: 80ms; }
.page .settings-group .settings-row:nth-child(3) { animation-delay: 120ms; }
.page .settings-group .settings-row:nth-child(4) { animation-delay: 160ms; }

.page .group-header {
  animation: group-enter 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  animation-delay: 60ms;
}

/* === Screen === */
.settings-screen {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  user-select: none;
  cursor: grab;
}

.settings-screen.dragging {
  cursor: grabbing;
}

.wallpaper {
  position: absolute;
  inset: 0;
  background: var(--color-bg-warm);
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

/* === Header === */
.settings-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px 12px;
  min-height: 44px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  background: rgba(250, 249, 246, 0.85);
  position: relative;
  z-index: 10;
}

.header-title h1 {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
}

/* === Scrollable body === */
.settings-body {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 40px;
}

/* === Search bar === */
.search-bar {
  margin: 0 16px 16px;
  padding: 9px 12px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-tertiary);
  font-size: 15px;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.search-bar.focused {
  background: rgba(0, 0, 0, 0.06);
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12);
}

.search-bar svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-size: 15px;
  color: var(--color-text);
  font-family: inherit;
  padding: 0;
  line-height: 1.4;
}

.search-input::placeholder {
  color: var(--color-text-tertiary);
}

.search-clear {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s ease;
}

.search-clear:active {
  opacity: 0.5;
}

.search-clear svg {
  width: 18px;
  height: 18px;
}

.search-results {
  animation: group-enter 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

.no-results {
  text-align: center;
  padding: 32px 16px;
  color: var(--color-text-secondary);
  font-size: 15px;
}

/* === Groups === */
.settings-group {
  background: var(--color-bg);
  border-radius: 12px;
  margin: 0 16px 24px;
  overflow: hidden;
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.04), 0 2px 8px rgba(0, 0, 0, 0.02);
}

.group-header {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 0 0 6px 32px;
  margin-top: 8px;
}

/* === Rows === */
.settings-row {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.1s ease;
  position: relative;
  min-height: 44px;
}

.settings-row:active {
  background: rgba(0, 0, 0, 0.03);
  transform: scale(0.995);
}

.settings-row + .settings-row {
  border-top: 0.5px solid rgba(0, 0, 0, 0.06);
}

.settings-row.column {
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

/* === Icons === */
.row-icon {
  width: 30px;
  height: 30px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: transparent;
  color: #1c1c1e;
  transition: color 0.25s ease, transform 0.2s ease;
}

.row-icon svg {
  width: 18px;
  height: 18px;
}

.airplane-icon.active {
  color: var(--color-success);
}

.row-icon-small {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-text-secondary);
}

.row-icon-small svg {
  width: 18px;
  height: 18px;
}

.app-badge svg {
  width: 18px;
  height: 18px;
}

/* === Labels & values === */
.row-label {
  font-size: 16px;
  color: var(--color-text);
  flex: 1;
}

.row-value {
  font-size: 15px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.row-value.connected {
  color: var(--color-success);
}

.connected-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-success);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

.row-chevron {
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
  flex-shrink: 0;
  transition: transform 0.15s ease;
}

.settings-row:active .row-chevron {
  transform: translateX(2px);
}

.row-end {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lock-icon {
  width: 14px;
  height: 14px;
  color: var(--color-text-muted);
}

.checkmark {
  width: 18px;
  height: 18px;
  color: var(--color-accent);
  flex-shrink: 0;
  animation: check-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes check-in {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}

/* === Toggle === */
.toggle {
  position: relative;
  display: inline-block;
  width: 51px;
  height: 31px;
  flex-shrink: 0;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: #e9e9ea;
  border-radius: 31px;
  transition: background 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 27px;
  height: 27px;
  left: 2px;
  bottom: 2px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.06);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toggle input:checked + .toggle-slider {
  background: var(--color-success);
}

.toggle input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

/* === Slider === */
.slider-group {
  padding: 14px 16px;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  color: var(--color-text-secondary);
}

.slider-track {
  flex: 1;
  position: relative;
  height: 28px;
  display: flex;
  align-items: center;
}

.slider-fill {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 4px;
  background: linear-gradient(90deg, #007aff, #5ac8fa);
  border-radius: 2px;
  pointer-events: none;
  transition: width 0.05s linear;
}

.slider {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: #e5e5ea;
  border-radius: 2px;
  outline: none;
  position: relative;
  z-index: 1;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 28px;
  height: 28px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: box-shadow 0.2s ease;
}

.slider::-webkit-slider-thumb:active {
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.25), 0 0 0 8px var(--color-accent-soft);
}

/* === Font size picker === */
.font-size-picker {
  display: flex;
  padding: 12px 16px;
  gap: 0;
}

.font-size-btn {
  flex: 1;
  padding: 10px 0;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text);
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.font-size-btn:first-child {
  border-radius: 8px 0 0 8px;
}

.font-size-btn:last-child {
  border-radius: 0 8px 8px 0;
}

.font-size-btn:not(:first-child) {
  border-left: none;
}

.font-size-btn:active {
  transform: scale(0.97);
}

.font-size-btn.active {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.25);
}

/* === Storage === */
.storage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.storage-bar {
  width: 100%;
  height: 6px;
  background: #e5e5ea;
  border-radius: 3px;
  overflow: hidden;
}

.storage-used {
  height: 100%;
  background: linear-gradient(90deg, #007aff, #5ac8fa);
  border-radius: 3px;
  animation: storage-fill 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
  animation-delay: 200ms;
}

@keyframes storage-fill {
  from { width: 0% !important; }
}

/* === Bluetooth === */
.bt-error {
  margin: 0 16px 16px;
  padding: 12px 16px;
  background: var(--color-danger-soft);
  border-radius: 10px;
  color: var(--color-danger);
  font-size: 14px;
  animation: group-enter 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

.bt-warning {
  margin: 0 16px 16px;
  padding: 12px 16px;
  background: var(--color-warning-soft);
  border-radius: 10px;
  color: var(--color-warning);
  font-size: 14px;
  animation: group-enter 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

.bt-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 32px;
  text-align: center;
  color: var(--color-text-secondary);
  gap: 8px;
}

.bt-empty svg {
  width: 36px;
  height: 36px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.bt-empty p {
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text);
  margin: 0;
}

.bt-empty span {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.settings-row.disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* === Characteristic detail === */
.char-header {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.char-name {
  font-size: 15px !important;
  flex: 1;
}

.char-props {
  font-size: 12px;
  color: var(--color-text-tertiary);
  background: rgba(0, 0, 0, 0.04);
  padding: 2px 8px;
  border-radius: 6px;
  flex-shrink: 0;
}

.char-uuid {
  font-size: 12px;
  color: var(--color-text-muted);
  font-family: 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
  word-break: break-all;
  width: 100%;
}

.char-selected {
  background: rgba(0, 122, 255, 0.03);
}

.char-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding-top: 4px;
  animation: row-enter 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

.char-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: var(--color-accent);
  color: white;
  font-size: 14px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
  align-self: flex-start;
}

.char-btn:active {
  transform: scale(0.97);
  opacity: 0.85;
}

.char-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.char-btn.active {
  background: var(--color-danger);
}

.char-write {
  display: flex;
  gap: 8px;
  align-items: center;
}

.char-write-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  font-size: 14px;
  font-family: 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
  background: white;
  color: var(--color-text);
  outline: none;
  transition: border-color 0.15s ease;
}

.char-write-input:focus {
  border-color: var(--color-accent);
}

.char-value {
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  padding: 10px 12px;
  animation: row-enter 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) both;
}

.char-value pre {
  margin: 0;
  font-size: 12px;
  font-family: 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace;
  color: var(--color-text);
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}

/* === Responsive === */
@media (min-width: 768px) {
  .settings-group {
    margin: 0 24px 24px;
  }

  .search-bar {
    margin: 0 24px 16px;
  }

  .group-header {
    padding-left: 40px;
  }
}
</style>
