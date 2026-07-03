import { describe, it, expect } from 'vitest'
import { screenRegistry, screenPlugins, getScreenPlugin, getScreenMeta, isBackgroundCard } from '../registry'
import type { ScreenId } from '../types'

const ALL_IDS: ScreenId[] = ['lock', 'home', 'settings', 'camera', 'photos']

describe('screen registry', () => {
  it('registers all five screens', () => {
    for (const id of ALL_IDS) {
      expect(screenRegistry[id]).toBeDefined()
    }
    expect(screenPlugins).toHaveLength(5)
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

  it('getScreenMeta returns only metadata fields', () => {
    const meta = getScreenMeta('settings')
    expect(meta).toEqual({ id: 'settings', label: 'Settings', color: '#f5f3ef', icon: '⚙️' })
  })

  it('lock is excluded from background cards; others are included', () => {
    expect(isBackgroundCard('lock')).toBe(false)
    for (const id of ALL_IDS.filter(i => i !== 'lock')) {
      expect(isBackgroundCard(id)).toBe(true)
    }
  })

  it('maps each screen emit to a navigation intent', () => {
    expect(screenRegistry.lock.events.unlock).toEqual({ type: 'push', screen: 'home' })
    expect(screenRegistry.home.events['go-lock']).toEqual({ type: 'lock' })
    expect(screenRegistry.home.events['show-cards']).toEqual({ type: 'show-cards' })
    expect(screenRegistry.settings.events['show-cards']).toEqual({ type: 'show-cards' })
    expect(screenRegistry.camera.events['go-back']).toEqual({ type: 'back' })
    expect(screenRegistry.photos.events['go-home']).toEqual({ type: 'home' })
  })
})
