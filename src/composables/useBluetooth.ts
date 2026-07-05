import { ref, shallowRef } from 'vue'
import { storage } from './storage'

// ─── Web Bluetooth type augmentations ────────────────────────────────
// These are not yet in the standard lib.dom.d.ts; declare the minimum
// surface we actually use.

declare global {
  interface BluetoothDevice {
    id: string
    name?: string
    gatt?: BluetoothRemoteGATTServer
    addEventListener(type: string, listener: (this: BluetoothDevice, ev: Event) => void): void
    removeEventListener(type: string, listener: (this: BluetoothDevice, ev: Event) => void): void
  }

  interface BluetoothRemoteGATTServer {
    device: BluetoothDevice
    connected: boolean
    connect(): Promise<BluetoothRemoteGATTServer>
    disconnect(): void
    getPrimaryService(service: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService>
    getPrimaryServices(service?: BluetoothServiceUUID): Promise<BluetoothRemoteGATTService[]>
  }

  interface BluetoothRemoteGATTService {
    uuid: string
    device: BluetoothDevice
    isPrimary: boolean
    getCharacteristic(characteristic: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic>
    getCharacteristics(characteristic?: BluetoothCharacteristicUUID): Promise<BluetoothRemoteGATTCharacteristic[]>
  }

  interface BluetoothRemoteGATTCharacteristic {
    uuid: string
    service: BluetoothRemoteGATTService
    properties: BluetoothCharacteristicProperties
    value?: DataView
    readValue(): Promise<DataView>
    writeValue(value: BufferSource): Promise<void>
    writeValueWithResponse(value: BufferSource): Promise<void>
    writeValueWithoutResponse(value: BufferSource): Promise<void>
    startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
    stopNotifications(): Promise<BluetoothRemoteGATTCharacteristic>
    addEventListener(type: string, listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => void): void
    removeEventListener(type: string, listener: (this: BluetoothRemoteGATTCharacteristic, ev: Event) => void): void
  }

  interface BluetoothCharacteristicProperties {
    read: boolean
    write: boolean
    writeWithoutResponse: boolean
    notify: boolean
    indicate: boolean
    broadcast: boolean
    reliableWrite: boolean
    writableAuxiliaries: boolean
  }

  type BluetoothServiceUUID = string
  type BluetoothCharacteristicUUID = string

  interface RequestDeviceOptions {
    filters?: BluetoothLEScanFilter[]
    optionalServices?: BluetoothServiceUUID[]
    acceptAllDevices?: boolean
  }

  interface BluetoothLEScanFilter {
    services?: BluetoothServiceUUID[]
    name?: string
    namePrefix?: string
  }

  interface Bluetooth {
    requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>
    getAvailability(): Promise<boolean>
  }

  interface Navigator {
    bluetooth?: Bluetooth
  }
}

// ─── Persistent storage helpers ──────────────────────────────────────

const STORAGE_KEY = 'mobile-bluetooth-devices'

interface StoredDevice {
  id: string
  name: string
}

async function loadStoredDevices(): Promise<StoredDevice[]> {
  try {
    const raw = await storage.get(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

async function saveStoredDevices(devices: StoredDevice[]): Promise<void> {
  try {
    await storage.set(STORAGE_KEY, JSON.stringify(devices))
  } catch { /* storage unavailable — silently ignore */ }
}

// ─── Well-known service / characteristic UUIDs ───────────────────────

const SERVICE_NAMES: Record<string, string> = {
  '00001800-0000-1000-8000-00805f9b34fb': 'Generic Access',
  '00001801-0000-1000-8000-00805f9b34fb': 'Generic Attribute',
  '0000180a-0000-1000-8000-00805f9b34fb': 'Device Information',
  '0000180f-0000-1000-8000-00805f9b34fb': 'Battery Service',
  '0000180d-0000-1000-8000-00805f9b34fb': 'Heart Rate',
  '00001810-0000-1000-8000-00805f9b34fb': 'Blood Pressure',
  '00001816-0000-1000-8000-00805f9b34fb': 'Cycling Speed & Cadence',
  '0000181c-0000-1000-8000-00805f9b34fb': 'User Data',
  '00001101-0000-1000-8000-00805f9b34fb': 'Serial Port',
  '0000110a-0000-1000-8000-00805f9b34fb': 'Audio Source',
  '0000110b-0000-1000-8000-00805f9b34fb': 'Audio Sink',
  '0000110e-0000-1000-8000-00805f9b34fb': 'A/V Remote Control',
  '00001108-0000-1000-8000-00805f9b34fb': 'Headset',
  '0000111e-0000-1000-8000-00805f9b34fb': 'Handsfree',
  '00001124-0000-1000-8000-00805f9b34fb': 'Human Interface Device',
}

const CHARACTERISTIC_NAMES: Record<string, string> = {
  '00002a00-0000-1000-8000-00805f9b34fb': 'Device Name',
  '00002a01-0000-1000-8000-00805f9b34fb': 'Appearance',
  '00002a19-0000-1000-8000-00805f9b34fb': 'Battery Level',
  '00002a29-0000-1000-8000-00805f9b34fb': 'Manufacturer Name',
  '00002a24-0000-1000-8000-00805f9b34fb': 'Model Number',
  '00002a25-0000-1000-8000-00805f9b34fb': 'Serial Number',
  '00002a26-0000-1000-8000-00805f9b34fb': 'Firmware Revision',
  '00002a27-0000-1000-8000-00805f9b34fb': 'Hardware Revision',
  '00002a28-0000-1000-8000-00805f9b34fb': 'Software Revision',
  '00002a37-0000-1000-8000-00805f9b34fb': 'Heart Rate Measurement',
  '00002a38-0000-1000-8000-00805f9b34fb': 'Body Sensor Location',
}

// ─── Exported types ──────────────────────────────────────────────────

export interface BTService {
  uuid: string
  name: string
  isPrimary: boolean
  characteristics: BTCharacteristic[]
}

export interface BTCharacteristic {
  uuid: string
  name: string
  serviceUuid: string
  properties: {
    read: boolean
    write: boolean
    writeWithoutResponse: boolean
    notify: boolean
    indicate: boolean
  }
  value: DataView | null
  notifying: boolean
}

export interface BTDevice {
  id: string
  name: string
  connected: boolean
  services: BTService[]
  _raw: BluetoothDevice
  _server: BluetoothRemoteGATTServer | null
  _charMap: Map<string, BluetoothRemoteGATTCharacteristic>
}

// ─── Composable ──────────────────────────────────────────────────────

export function useBluetooth() {
  const isSupported = ref(typeof navigator !== 'undefined' && !!navigator.bluetooth)
  const isScanning = ref(false)
  const pairedDevices = ref<BTDevice[]>([])
  const discoveredDevices = ref<BTDevice[]>([])
  const selectedDevice = shallowRef<BTDevice | null>(null)
  const error = ref<string | null>(null)

  const _knownNames = new Map<string, string>()

  async function init(): Promise<void> {
    const stored = await loadStoredDevices()
    for (const d of stored) _knownNames.set(d.id, d.name)
  }
  const initPromise = init()

  // ─── Helpers ──────────────────────────────────────────────────────

  function serviceDisplayName(uuid: string): string {
    const short = uuid.replace(/-/g, '')
    return SERVICE_NAMES[uuid] ?? SERVICE_NAMES[short] ?? uuid.slice(0, 8)
  }

  function characteristicDisplayName(uuid: string): string {
    const short = uuid.replace(/-/g, '')
    return CHARACTERISTIC_NAMES[uuid] ?? CHARACTERISTIC_NAMES[short] ?? uuid.slice(0, 8)
  }

  function _buildDevice(raw: BluetoothDevice): BTDevice {
    const id = raw.id
    const name = raw.name ?? _knownNames.get(id) ?? 'Unknown Device'
    // Remember the name for future sessions
    _knownNames.set(id, name)
    return {
      id,
      name,
      connected: false,
      services: [],
      _raw: raw,
      _server: null,
      _charMap: new Map(),
    }
  }

  function _persistKnownDevices(): void {
    const all = [..._knownNames.entries()].map(([id, name]) => ({ id, name }))
    saveStoredDevices(all).catch(() => {})
  }

  function _getOrCreate(list: BTDevice[], raw: BluetoothDevice): BTDevice {
    const existing = list.find(d => d.id === raw.id)
    if (existing) {
      // Update name if we now have a better one
      if (raw.name && existing.name !== raw.name) {
        existing.name = raw.name
        _knownNames.set(raw.id, raw.name)
        _persistKnownDevices()
      }
      return existing
    }
    const dev = _buildDevice(raw)
    list.push(dev)
    return dev
  }

  // ─── Scanning ─────────────────────────────────────────────────────

  async function requestDevice(): Promise<BTDevice | null> {
    if (!navigator.bluetooth) {
      error.value = 'Web Bluetooth is not supported in this browser.'
      return null
    }

    error.value = null
    isScanning.value = true

    try {
      const raw = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: Object.keys(SERVICE_NAMES),
      })

      const dev = _getOrCreate(discoveredDevices.value, raw)
      _knownNames.set(dev.id, dev.name)
      _persistKnownDevices()

      // Listen for disconnection
      raw.addEventListener('gattserverdisconnected', () => {
        dev.connected = false
        // Force reactivity
        discoveredDevices.value = [...discoveredDevices.value]
        pairedDevices.value = [...pairedDevices.value]
      })

      return dev
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotFoundError') {
        // User cancelled the chooser — not an error
        return null
      }
      error.value = err instanceof Error ? err.message : String(err)
      return null
    } finally {
      isScanning.value = false
    }
  }

  // ─── Connection ───────────────────────────────────────────────────

  async function connect(dev: BTDevice): Promise<void> {
    if (!dev._raw.gatt) {
      error.value = 'GATT server not available on this device.'
      return
    }

    error.value = null

    try {
      const server = await dev._raw.gatt.connect()
      dev._server = server
      dev.connected = true

      // Move to paired list if not already there
      if (!pairedDevices.value.find(d => d.id === dev.id)) {
        pairedDevices.value = [...pairedDevices.value, dev]
      }
      _knownNames.set(dev.id, dev.name)
      _persistKnownDevices()

      // Discover services automatically
      await discoverServices(dev)
    } catch (err: unknown) {
      dev.connected = false
      error.value = err instanceof Error ? err.message : String(err)
    }
  }

  async function disconnect(dev: BTDevice): Promise<void> {
    error.value = null
    try {
      dev._server?.disconnect()
    } catch { /* already disconnected */ }
    dev.connected = false
    dev._server = null

    // Clear notification state
    for (const svc of dev.services) {
      for (const char of svc.characteristics) {
        char.notifying = false
      }
    }

    // Trigger reactivity
    pairedDevices.value = [...pairedDevices.value]
    discoveredDevices.value = [...discoveredDevices.value]
  }

  // ─── Service & Characteristic discovery ───────────────────────────

  async function discoverServices(dev: BTDevice): Promise<BTService[]> {
    if (!dev._server?.connected) {
      error.value = 'Device is not connected.'
      return []
    }

    error.value = null

    try {
      const rawServices = await dev._server.getPrimaryServices()
      const services: BTService[] = []

      for (const rawSvc of rawServices) {
        const rawChars = await rawSvc.getCharacteristics()
        const characteristics: BTCharacteristic[] = rawChars.map(rawChar => {
          const btChar: BTCharacteristic = {
            uuid: rawChar.uuid,
            name: characteristicDisplayName(rawChar.uuid),
            serviceUuid: rawSvc.uuid,
            properties: {
              read: rawChar.properties.read,
              write: rawChar.properties.write,
              writeWithoutResponse: rawChar.properties.writeWithoutResponse,
              notify: rawChar.properties.notify,
              indicate: rawChar.properties.indicate,
            },
            value: rawChar.value ?? null,
            notifying: false,
          }
          dev._charMap.set(rawChar.uuid, rawChar)
          return btChar
        })

        services.push({
          uuid: rawSvc.uuid,
          name: serviceDisplayName(rawSvc.uuid),
          isPrimary: rawSvc.isPrimary,
          characteristics,
        })
      }

      dev.services = services
      return services
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      return []
    }
  }

  // ─── Characteristic operations ────────────────────────────────────

  async function readCharacteristic(dev: BTDevice, char: BTCharacteristic): Promise<DataView | null> {
    const raw = dev._charMap.get(char.uuid)
    if (!raw) {
      error.value = 'Characteristic not found.'
      return null
    }

    error.value = null
    try {
      const value = await raw.readValue()
      char.value = value
      return value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      return null
    }
  }

  async function writeCharacteristic(
    dev: BTDevice,
    char: BTCharacteristic,
    value: ArrayBuffer,
    withResponse = true,
  ): Promise<boolean> {
    const raw = dev._charMap.get(char.uuid)
    if (!raw) {
      error.value = 'Characteristic not found.'
      return false
    }

    error.value = null
    try {
      if (withResponse) {
        await raw.writeValueWithResponse(value)
      } else {
        await raw.writeValueWithoutResponse(value)
      }
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      return false
    }
  }

  async function startNotifications(
    dev: BTDevice,
    char: BTCharacteristic,
    callback: (value: DataView) => void,
  ): Promise<boolean> {
    const raw = dev._charMap.get(char.uuid)
    if (!raw) {
      error.value = 'Characteristic not found.'
      return false
    }

    error.value = null
    try {
      await raw.startNotifications()
      char.notifying = true

      const handler = () => {
        if (raw.value) callback(raw.value)
      }
      raw.addEventListener('characteristicvaluechanged', handler)

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      return false
    }
  }

  async function stopNotifications(dev: BTDevice, char: BTCharacteristic): Promise<boolean> {
    const raw = dev._charMap.get(char.uuid)
    if (!raw) return false

    error.value = null
    try {
      await raw.stopNotifications()
      char.notifying = false
      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : String(err)
      return false
    }
  }

  // ─── Device management ────────────────────────────────────────────

  function removeDevice(dev: BTDevice): void {
    // Disconnect first if connected
    if (dev.connected) {
      dev._server?.disconnect()
      dev.connected = false
    }

    pairedDevices.value = pairedDevices.value.filter(d => d.id !== dev.id)
    discoveredDevices.value = discoveredDevices.value.filter(d => d.id !== dev.id)

    _knownNames.delete(dev.id)
    _persistKnownDevices()

    if (selectedDevice.value?.id === dev.id) {
      selectedDevice.value = null
    }
  }

  function selectDevice(dev: BTDevice | null): void {
    selectedDevice.value = dev
  }

  return {
    isSupported,
    isScanning,
    pairedDevices,
    discoveredDevices,
    selectedDevice,
    error,
    init: () => initPromise,
    requestDevice,
    connect,
    disconnect,
    discoverServices,
    readCharacteristic,
    writeCharacteristic,
    startNotifications,
    stopNotifications,
    removeDevice,
    selectDevice,
    serviceDisplayName,
    characteristicDisplayName,
  }
}
