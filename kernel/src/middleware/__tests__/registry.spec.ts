import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { registerScreen, getRegisteredScreen, getRegisteredScreens, resetRegistry } from '../registry'
import { onScreen, resetBus } from '../bus'
import type { ScreenMeta, ScreenRegistration } from '../types'

const homeMeta: ScreenMeta = { id: 'home', label: 'Home', color: '#fff', icon: 'home' }
const settingsMeta: ScreenMeta = { id: 'settings', label: 'Settings', color: '#ccc', icon: 'settings' }

describe('registry', () => {
  beforeEach(() => {
    resetRegistry()
    resetBus()
  })

  afterEach(() => {
    resetRegistry()
    resetBus()
  })

  it('registerScreen stores a screen registration', () => {
    registerScreen(homeMeta, { tap: { type: 'push', screen: 'settings' } })
    const reg = getRegisteredScreen('home')
    expect(reg).toBeDefined()
    expect(reg!.meta).toEqual(homeMeta)
    expect(reg!.events).toEqual({ tap: { type: 'push', screen: 'settings' } })
  })

  it('getRegisteredScreen returns the registered screen', () => {
    registerScreen(homeMeta, {})
    const reg = getRegisteredScreen('home')
    expect(reg).toBeDefined()
    expect(reg!.meta.id).toBe('home')
  })

  it('getRegisteredScreen returns undefined for unknown id', () => {
    expect(getRegisteredScreen('photos')).toBeUndefined()
  })

  it('getRegisteredScreens returns all registered screens', () => {
    registerScreen(homeMeta, {})
    registerScreen(settingsMeta, {})
    const all = getRegisteredScreens()
    expect(all).toHaveLength(2)
    expect(all.map(s => s.meta.id)).toEqual(expect.arrayContaining(['home', 'settings']))
  })

  it('resetRegistry clears all registrations', () => {
    registerScreen(homeMeta, {})
    resetRegistry()
    expect(getRegisteredScreen('home')).toBeUndefined()
    expect(getRegisteredScreens()).toHaveLength(0)
  })

  it('registering with the same id overwrites the previous', () => {
    registerScreen(homeMeta, { a: { type: 'lock' } })
    registerScreen(homeMeta, { b: { type: 'home' } })
    const reg = getRegisteredScreen('home')
    expect(reg!.events).toEqual({ b: { type: 'home' } })
    expect(getRegisteredScreens()).toHaveLength(1)
  })

  it('registerScreen emits on the screen bus channel', () => {
    const handler = vi.fn()
    const off = onScreen(handler)
    registerScreen(homeMeta, { tap: { type: 'lock' } })
    expect(handler).toHaveBeenCalledWith({
      meta: homeMeta,
      events: { tap: { type: 'lock' } },
    })
    off()
  })
})
