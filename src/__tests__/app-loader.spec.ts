import { describe, it, expect, vi, beforeEach } from 'vitest'
import { h } from 'vue'
import { resetRegistry, resetBus, setKernel, getRegisteredScreen } from '@micronet/kernel'
import {
  isAppLoaded,
  clearLoadedApps,
  getLoadedApps,
  configureLoader,
  unloadAllApps,
  registerAppInstance,
  encodeBundle,
  buildBundle,
} from '@micronet/sdk'
import type { AppManifest } from '@micronet/sdk'
import { loadAppsSync, loadAppsAsync, appIds } from '../app-loader'
import type { AppEntry } from '../app-loader'
import { createKernelAPI } from '../kernel-setup'

/** Minimal manifest factory for tests */
function makeManifest(id: string, overrides?: Partial<AppManifest>): AppManifest {
  return {
    id,
    name: `Test ${id}`,
    version: '1.0.0',
    icon: '📱',
    color: '#007aff',
    permissions: [],
    events: {},
    ...overrides,
  }
}

/** Minimal Vue component stub */
function makeComponent(name = 'Stub') {
  return { name, setup() { return () => h('div', name) } }
}

/** Create a valid .mnapp binary for a given manifest and code */
function makeMnAppBytes(manifest: AppManifest, code?: string): Uint8Array {
  const defaultCode = [
    '"use strict";',
    'Object.defineProperty(exports, "__esModule", { value: true });',
    `const manifest = ${JSON.stringify(manifest)};`,
    'const component = { name: "App_' + manifest.id + '", setup() { return function() { return null; } } };',
    'exports.default = { manifest, component };',
    'exports.manifest = manifest;',
    'exports.component = component;',
  ].join('\n')

  return encodeBundle(buildBundle({ manifest, code: code ?? defaultCode }))
}

describe('app-loader', () => {
  beforeEach(() => {
    setKernel(createKernelAPI())
    clearLoadedApps()
    unloadAllApps()
    resetRegistry()
    resetBus()
    configureLoader({})
  })

  describe('appIds', () => {
    it('contains all 13 built-in app IDs', () => {
      expect(appIds).toHaveLength(13)
      expect(appIds).toContain('lock')
      expect(appIds).toContain('home')
      expect(appIds).toContain('settings')
      expect(appIds).toContain('camera')
      expect(appIds).toContain('photos')
      expect(appIds).toContain('maps')
      expect(appIds).toContain('calendar')
      expect(appIds).toContain('notes')
      expect(appIds).toContain('clock')
      expect(appIds).toContain('files')
      expect(appIds).toContain('weather')
      expect(appIds).toContain('calculator')
      expect(appIds).toContain('compass')
    })

    it('starts with lock as the first app', () => {
      expect(appIds[0]).toBe('lock')
    })

    it('is a readonly tuple', () => {
      expect(appIds).toBeInstanceOf(Array)
    })
  })

  describe('loadAppsSync', () => {
    it('registers all provided entries', () => {
      const entries: AppEntry[] = [
        { manifest: makeManifest('test-a'), component: makeComponent('A') },
        { manifest: makeManifest('test-b'), component: makeComponent('B') },
      ]

      loadAppsSync(entries)

      expect(isAppLoaded('test-a')).toBe(true)
      expect(isAppLoaded('test-b')).toBe(true)
      expect(getLoadedApps()).toHaveLength(2)
    })

    it('skips already-loaded apps', () => {
      const manifest = makeManifest('test-skip')
      const entries: AppEntry[] = [
        { manifest, component: makeComponent('First') },
      ]

      loadAppsSync(entries)
      expect(getLoadedApps()).toHaveLength(1)

      // Loading again should not throw or duplicate
      loadAppsSync(entries)
      expect(getLoadedApps()).toHaveLength(1)
    })

    it('handles empty entries array', () => {
      loadAppsSync([])
      expect(getLoadedApps()).toHaveLength(0)
    })

    it('registers screen in the kernel registry', () => {
      const entries: AppEntry[] = [
        { manifest: makeManifest('test-reg'), component: makeComponent() },
      ]

      loadAppsSync(entries)

      const reg = getRegisteredScreen('test-reg' as any)
      expect(reg).toBeDefined()
      expect(reg!.meta.label).toBe('Test test-reg')
    })
  })

  describe('loadAppsAsync', () => {
    function setupFetchMock(responses: Record<string, { ok: boolean; body?: Uint8Array; status?: number }>) {
      const fetchMock = vi.fn(async (url: string) => {
        const key = url.replace('/apps/', '').replace('.mnapp', '')
        const resp = responses[key]
        if (!resp) {
          return { ok: false, status: 404, arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)) }
        }
        return {
          ok: resp.ok,
          status: resp.status ?? (resp.ok ? 200 : 500),
          arrayBuffer: () => Promise.resolve(resp.body?.buffer ?? new ArrayBuffer(0)),
        }
      })
      vi.stubGlobal('fetch', fetchMock)
      return fetchMock
    }

    it('fetches and loads all apps from .mnapp bundles', async () => {
      const responses: Record<string, { ok: boolean; body: Uint8Array }> = {}
      for (const id of appIds) {
        const manifest = makeManifest(id)
        responses[id] = { ok: true, body: makeMnAppBytes(manifest) }
      }
      const fetchMock = setupFetchMock(responses)

      await loadAppsAsync()

      expect(fetchMock).toHaveBeenCalledTimes(13)
      for (const id of appIds) {
        expect(isAppLoaded(id)).toBe(true)
      }
    })

    it('skips already-loaded apps', async () => {
      // Pre-register one app
      registerAppInstance(makeManifest('lock'), makeComponent())

      const responses: Record<string, { ok: boolean; body: Uint8Array }> = {}
      for (const id of appIds) {
        responses[id] = { ok: true, body: makeMnAppBytes(makeManifest(id)) }
      }
      const fetchMock = setupFetchMock(responses)

      await loadAppsAsync()

      // lock should not have been fetched since it was already loaded
      expect(fetchMock).not.toHaveBeenCalledWith('/apps/lock.mnapp')
    })

    it('continues loading other apps when one fetch fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const responses: Record<string, { ok: boolean; body?: Uint8Array; status?: number }> = {}
      for (const id of appIds) {
        if (id === 'camera') {
          responses[id] = { ok: false, status: 500 }
        } else {
          responses[id] = { ok: true, body: makeMnAppBytes(makeManifest(id)) }
        }
      }
      setupFetchMock(responses)

      await loadAppsAsync()

      // camera should not be loaded, others should
      expect(isAppLoaded('camera')).toBe(false)
      expect(isAppLoaded('lock')).toBe(true)
      expect(isAppLoaded('home')).toBe(true)
      expect(isAppLoaded('settings')).toBe(true)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch camera.mnapp'),
      )
      consoleSpy.mockRestore()
    })

    it('continues loading when fetch throws a network error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const fetchMock = vi.fn(async (url: string) => {
        const id = url.replace('/apps/', '').replace('.mnapp', '')
        if (id === 'maps') throw new Error('Network error')
        return {
          ok: true,
          status: 200,
          arrayBuffer: () => Promise.resolve(makeMnAppBytes(makeManifest(id)).buffer),
        }
      })
      vi.stubGlobal('fetch', fetchMock)

      await loadAppsAsync()

      expect(isAppLoaded('maps')).toBe(false)
      expect(isAppLoaded('lock')).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load app "maps"'),
        expect.any(Error),
      )
      consoleSpy.mockRestore()
    })

    it('continues when decodeBundle throws on bad data', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const fetchMock = vi.fn(async (url: string) => {
        const id = url.replace('/apps/', '').replace('.mnapp', '')
        if (id === 'notes') {
          // Return garbage bytes that will fail decode
          return {
            ok: true,
            status: 200,
            arrayBuffer: () => Promise.resolve(new Uint8Array([0, 0, 0, 0]).buffer),
          }
        }
        return {
          ok: true,
          status: 200,
          arrayBuffer: () => Promise.resolve(makeMnAppBytes(makeManifest(id)).buffer),
        }
      })
      vi.stubGlobal('fetch', fetchMock)

      await loadAppsAsync()

      expect(isAppLoaded('notes')).toBe(false)
      expect(isAppLoaded('lock')).toBe(true)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('handles all apps failing gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const fetchMock = vi.fn(async () => { throw new Error('DNS failure') })
      vi.stubGlobal('fetch', fetchMock)

      await loadAppsAsync()

      expect(getLoadedApps()).toHaveLength(0)
      expect(consoleSpy).toHaveBeenCalledTimes(13)
      consoleSpy.mockRestore()
    })
  })

  describe('clearLoadedApps', () => {
    it('removes all loaded apps', () => {
      const entries: AppEntry[] = [
        { manifest: makeManifest('x'), component: makeComponent() },
        { manifest: makeManifest('y'), component: makeComponent() },
      ]
      loadAppsSync(entries)
      expect(getLoadedApps()).toHaveLength(2)

      clearLoadedApps()
      expect(getLoadedApps()).toHaveLength(0)
      expect(isAppLoaded('x')).toBe(false)
      expect(isAppLoaded('y')).toBe(false)
    })

    it('is safe to call when no apps are loaded', () => {
      clearLoadedApps()
      expect(getLoadedApps()).toHaveLength(0)
    })
  })
})
