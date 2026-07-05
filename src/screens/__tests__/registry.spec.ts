import { describe, it, expect } from 'vitest'
import { screenRegistry, screenPlugins, getScreenPlugin } from '../registry'
import type { ScreenId } from '../types'

const ALL_IDS: ScreenId[] = ['lock', 'home', 'settings', 'camera', 'photos', 'maps']

describe('screen registry', () => {
  it('registers all six screens', () => {
    for (const id of ALL_IDS) {
      expect(screenRegistry[id]).toBeDefined()
    }
    expect(screenPlugins).toHaveLength(6)
  })

  it('every plugin carries a component and metadata', () => {
    for (const plugin of screenPlugins) {
      expect(plugin.component).toBeDefined()
      expect(plugin.label).toBeTruthy()
      expect(plugin.color).toMatch(/^#/)
      expect(plugin.icon).toBeTruthy()
      expect(Object.keys(plugin.events).length).toBeGreaterThan(0)
    }
  })

  it('getScreenPlugin returns the plugin for an id', () => {
    expect(getScreenPlugin('camera').id).toBe('camera')
  })

  it('maps each screen emit to a navigation intent', () => {
    expect(screenRegistry.lock.events.unlock).toEqual({ type: 'push', screen: 'home' })
    expect(screenRegistry.home.events['go-lock']).toEqual({ type: 'lock' })
    expect(screenRegistry.camera.events['go-back']).toEqual({ type: 'back' })
    expect(screenRegistry.photos.events['go-home']).toEqual({ type: 'home' })
  })
})
