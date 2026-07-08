/**
 * Tests for the build-apps.mjs script's pure logic.
 *
 * The script itself is a self-executing module, so we test its helper
 * functions by re-implementing them (they are pure) and verify the
 * .mnapp binary format round-trips correctly with the SDK decoder.
 */
import { describe, it, expect } from 'vitest'

// ── Re-implement helpers from build-apps.mjs ─────────────────────────────

function encodeBundle(bundle) {
  const json = JSON.stringify(bundle)
  const data = new TextEncoder().encode(json)
  const headerSize = 14 // MNAPP(5) + version(1) + pad(4) + len(4)
  const buf = new ArrayBuffer(headerSize + data.length)
  const view = new DataView(buf)
  const header = new Uint8Array(buf)
  header[0] = 0x4d // M
  header[1] = 0x4e // N
  header[2] = 0x41 // A
  header[3] = 0x50 // P
  header[4] = 0x50 // P
  header[5] = 1 // MNAPP_VERSION
  view.setUint32(10, data.length, false)
  header.set(data, headerSize)
  return header
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function hashPath(path) {
  let hash = 0
  for (let i = 0; i < path.length; i++) {
    hash = ((hash << 5) - hash) + path.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(16).substring(0, 8)
}

// ── Import SDK decoder for round-trip verification ───────────────────────

import { decodeBundle } from '../../sdk/src/build.ts'

// ── Test data ────────────────────────────────────────────────────────────

const APP_MANIFESTS = [
  { id: 'lock', name: 'LockScreen', dir: 'apps/src/components' },
  { id: 'home', name: 'HomeScreen', dir: 'apps/src/components/home' },
  { id: 'settings', name: 'SettingsScreen', dir: 'apps/src/components/settings' },
  { id: 'camera', name: 'CameraScreen', dir: 'apps/src/components/camera' },
  { id: 'photos', name: 'PhotosScreen', dir: 'apps/src/components/photos' },
  { id: 'maps', name: 'MapsScreen', dir: 'apps/src/components/maps' },
  { id: 'calendar', name: 'CalendarScreen', dir: 'apps/src/components/calendar' },
  { id: 'notes', name: 'NotesScreen', dir: 'apps/src/components/notes' },
  { id: 'clock', name: 'ClockScreen', dir: 'apps/src/components/clock' },
  { id: 'files', name: 'FilesScreen', dir: 'apps/src/components/files' },
  { id: 'weather', name: 'WeatherScreen', dir: 'apps/src/components/weather' },
  { id: 'calculator', name: 'CalculatorScreen', dir: 'apps/src/components/calculator' },
  { id: 'compass', name: 'CompassScreen', dir: 'apps/src/components/compass' },
]

// ── Tests ────────────────────────────────────────────────────────────────

describe('build-apps helpers', () => {
  describe('encodeBundle', () => {
    it('produces correct magic header', () => {
      const bundle = { manifest: { id: 'test', name: 'T', version: '1' }, code: 'x' }
      const bytes = encodeBundle(bundle)

      expect(bytes[0]).toBe(0x4d) // M
      expect(bytes[1]).toBe(0x4e) // N
      expect(bytes[2]).toBe(0x41) // A
      expect(bytes[3]).toBe(0x50) // P
      expect(bytes[4]).toBe(0x50) // P
      expect(bytes[5]).toBe(1)    // version
    })

    it('round-trips with SDK decodeBundle', () => {
      const bundle = {
        manifest: { id: 'roundtrip', name: 'RT', version: '1.0.0', icon: '📱', color: '#007aff' },
        code: 'const x = "hello";',
        i18n: { en: { key: 'value' } },
      }

      const encoded = encodeBundle(bundle)
      const decoded = decodeBundle(encoded)

      expect(decoded.manifest.id).toBe('roundtrip')
      expect(decoded.code).toBe('const x = "hello";')
      expect(decoded.i18n.en.key).toBe('value')
    })

    it('handles empty code', () => {
      const bundle = { manifest: { id: 'empty', name: 'E', version: '1' }, code: '' }
      const encoded = encodeBundle(bundle)
      const decoded = decodeBundle(encoded)
      expect(decoded.code).toBe('')
    })

    it('handles unicode content', () => {
      const bundle = {
        manifest: { id: 'unicode', name: '日本語', version: '1', icon: '🎌', color: '#fff' },
        code: 'const msg = "你好世界";',
      }
      const encoded = encodeBundle(bundle)
      const decoded = decodeBundle(encoded)
      expect(decoded.manifest.name).toBe('日本語')
      expect(decoded.code).toContain('你好世界')
    })

    it('handles large payloads', () => {
      const largeCode = 'x'.repeat(50_000)
      const bundle = { manifest: { id: 'large', name: 'L', version: '1' }, code: largeCode }
      const encoded = encodeBundle(bundle)
      expect(encoded.length).toBeGreaterThan(50_000)
      const decoded = decodeBundle(encoded)
      expect(decoded.code).toBe(largeCode)
    })
  })

  describe('formatSize', () => {
    it('formats bytes under 1024', () => {
      expect(formatSize(0)).toBe('0 B')
      expect(formatSize(1)).toBe('1 B')
      expect(formatSize(512)).toBe('512 B')
      expect(formatSize(1023)).toBe('1023 B')
    })

    it('formats kilobytes', () => {
      expect(formatSize(1024)).toBe('1.0 KB')
      expect(formatSize(1536)).toBe('1.5 KB')
      expect(formatSize(10240)).toBe('10.0 KB')
    })

    it('formats megabytes', () => {
      expect(formatSize(1048576)).toBe('1.0 MB')
      expect(formatSize(1572864)).toBe('1.5 MB')
    })
  })

  describe('hashPath', () => {
    it('returns a hex string', () => {
      const hash = hashPath('/some/path.vue')
      expect(hash).toMatch(/^[0-9a-f]+$/)
    })

    it('returns consistent hashes for the same input', () => {
      expect(hashPath('/a/b/c.vue')).toBe(hashPath('/a/b/c.vue'))
    })

    it('returns different hashes for different inputs', () => {
      const h1 = hashPath('/a.vue')
      const h2 = hashPath('/b.vue')
      expect(h1).not.toBe(h2)
    })

    it('returns at most 8 characters', () => {
      const hash = hashPath('/very/long/path/to/some/deeply/nested/component.vue')
      expect(hash.length).toBeLessThanOrEqual(8)
    })

    it('handles empty string', () => {
      const hash = hashPath('')
      expect(hash).toBe('0')
    })
  })

  describe('app manifest list', () => {
    it('defines exactly 13 apps', () => {
      expect(APP_MANIFESTS).toHaveLength(13)
    })

    it('lock is first (must load before other apps)', () => {
      expect(APP_MANIFESTS[0].id).toBe('lock')
    })

    it('all apps have unique IDs', () => {
      const ids = APP_MANIFESTS.map(a => a.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('all apps have matching component file names', () => {
      for (const app of APP_MANIFESTS) {
        expect(app.name).toBe(`${app.id.charAt(0).toUpperCase() + app.id.slice(1)}Screen`)
      }
    })

    it('lock screen is in the root components directory', () => {
      const lock = APP_MANIFESTS.find(a => a.id === 'lock')
      expect(lock.dir).toBe('apps/src/components')
    })

    it('all other apps are in subdirectories', () => {
      const nonLock = APP_MANIFESTS.filter(a => a.id !== 'lock')
      for (const app of nonLock) {
        expect(app.dir).toContain('/')
        expect(app.dir).not.toBe('apps/src/components')
      }
    })
  })
})
