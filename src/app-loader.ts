import type { Component } from 'vue'
import type { AppManifest } from '@micronet/sdk'
import {
  isAppLoaded,
  registerAppInstance,
  clearLoadedApps,
  loadAppFromBundle,
  decodeBundle,
} from '@micronet/sdk'

export interface AppEntry {
  manifest: AppManifest
  component: Component
}

/**
 * The canonical list of built-in app IDs, in load order.  Lock must load
 * first because it is the initial screen.
 */
export const appIds = [
  'lock', 'home', 'settings', 'camera', 'photos', 'maps', 'calendar',
  'notes', 'clock', 'files', 'weather', 'calculator', 'compass',
] as const

/**
 * Dev / test path: register apps directly from their source Vue components.
 * This avoids the .mnapp fetch + eval round-trip and gives hot-module reload
 * support during development.
 */
export function loadAppsSync(entries: AppEntry[]): void {
  for (const { manifest, component } of entries) {
    if (!isAppLoaded(manifest.id)) {
      registerAppInstance(manifest, component)
    }
  }
}

/**
 * Production path: fetch each compiled .mnapp bundle from /apps/ and load it
 * through the SDK loader.  The loader evals the bundle code with a require
 * resolver that provides vue / vue-i18n / @micronet/sdk / maplibre-gl from the
 * host runtime.
 */
export async function loadAppsAsync(): Promise<void> {
  for (const id of appIds) {
    if (isAppLoaded(id)) continue
    try {
      const resp = await fetch(`/apps/${id}.mnapp`)
      if (!resp.ok) {
        console.error(`[app-loader] Failed to fetch ${id}.mnapp: ${resp.status}`)
        continue
      }
      const buf = new Uint8Array(await resp.arrayBuffer())
      const bundle = decodeBundle(buf)
      loadAppFromBundle(bundle)
    } catch (err) {
      console.error(`[app-loader] Failed to load app "${id}":`, err)
    }
  }
}

export { clearLoadedApps }
