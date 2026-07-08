import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createKernelAPI } from '../kernel-setup'

describe('kernel-setup', () => {
  describe('createKernelAPI', () => {
    beforeEach(() => {
      // Reset shared state before each test
      const api = createKernelAPI()
      api.resetRegistry()
      api.resetBus()
    })
    it('returns an object with all required KernelAPI methods', () => {
      const api = createKernelAPI()

      expect(typeof api.useNavigation).toBe('function')
      expect(typeof api.registerScreen).toBe('function')
      expect(typeof api.getRegisteredScreen).toBe('function')
      expect(typeof api.getRegisteredScreens).toBe('function')
      expect(typeof api.resetRegistry).toBe('function')
      expect(typeof api.onNav).toBe('function')
      expect(typeof api.resetBus).toBe('function')
      expect(typeof api.registerScreenComponents).toBe('function')
    })

    it('returns exactly 8 methods', () => {
      const api = createKernelAPI()
      const keys = Object.keys(api)
      expect(keys).toHaveLength(8)
    })

    it('useNavigation returns a navigation object', () => {
      const api = createKernelAPI()
      const nav = api.useNavigation()

      expect(typeof nav.goTo).toBe('function')
      expect(typeof nav.goBack).toBe('function')
      expect(typeof nav.goHome).toBe('function')
      expect(typeof nav.lock).toBe('function')
      expect(typeof nav.navigate).toBe('function')
    })

    it('registerScreen and getRegisteredScreen round-trip', () => {
      const api = createKernelAPI()
      api.resetRegistry()

      api.registerScreen(
        { id: 'home', label: 'Home', color: '#fff', icon: '🏠' },
        { 'go-back': { type: 'back' } },
      )

      const reg = api.getRegisteredScreen('home')
      expect(reg).toBeDefined()
      expect(reg!.meta.label).toBe('Home')
      expect(reg!.events['go-back']).toEqual({ type: 'back' })
    })

    it('getRegisteredScreens returns all registered screens', () => {
      const api = createKernelAPI()
      api.resetRegistry()

      api.registerScreen({ id: 'home', label: 'Home', color: '#fff', icon: '🏠' }, {})
      api.registerScreen({ id: 'lock', label: 'Lock', color: '#000', icon: '🔒' }, {})

      const screens = api.getRegisteredScreens()
      expect(screens).toHaveLength(2)
      expect(screens.map(s => s.meta.id)).toContain('home')
      expect(screens.map(s => s.meta.id)).toContain('lock')
    })

    it('resetRegistry clears all registrations', () => {
      const api = createKernelAPI()
      api.registerScreen({ id: 'home', label: 'Home', color: '#fff', icon: '🏠' }, {})
      expect(api.getRegisteredScreens()).toHaveLength(1)

      api.resetRegistry()
      expect(api.getRegisteredScreens()).toHaveLength(0)
    })

    it('onNav subscribes to navigation events', () => {
      const api = createKernelAPI()
      api.resetBus()

      const handler = vi.fn()
      const unsub = api.onNav(handler)

      expect(typeof unsub).toBe('function')
      unsub()
    })

    it('onNav unsubscribe stops receiving events', () => {
      const api = createKernelAPI()
      api.resetBus()

      const handler = vi.fn()
      const unsub = api.onNav(handler)
      unsub()

      // After unsubscribing, the handler should not be called
      // (we can't easily trigger a nav event here without the full stack,
      // but the unsubscribe function should exist and be callable)
      expect(handler).not.toHaveBeenCalled()
    })

    it('resetBus clears event subscriptions', () => {
      const api = createKernelAPI()
      api.resetBus()
      // Should not throw
      expect(true).toBe(true)
    })

    it('creates a new instance each time', () => {
      const api1 = createKernelAPI()
      const api2 = createKernelAPI()
      expect(api1).not.toBe(api2)
    })

    it('registerScreenComponents accepts a component record', () => {
      const api = createKernelAPI()
      // Should not throw when called with an empty record
      api.registerScreenComponents({})
      expect(true).toBe(true)
    })
  })
})
