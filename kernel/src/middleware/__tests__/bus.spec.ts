import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { emitNav, emitScreen, onNav, onScreen, resetBus } from '../bus'
import type { NavRequest, ScreenRegistration } from '../types'

const mockNav: NavRequest = { action: 'push', screen: 'home' }
const mockScreen: ScreenRegistration = {
  meta: { id: 'home', label: 'Home', color: '#fff', icon: 'home' },
  events: {},
}

describe('onNav', () => {
  beforeEach(() => { resetBus() })
  afterEach(() => { resetBus() })

  it('receives emitted nav messages', () => {
    const handler = vi.fn()
    onNav(handler)
    emitNav(mockNav)
    expect(handler).toHaveBeenCalledWith(mockNav)
  })

  it('multiple handlers all receive the message', () => {
    const h1 = vi.fn()
    const h2 = vi.fn()
    onNav(h1)
    onNav(h2)
    emitNav(mockNav)
    expect(h1).toHaveBeenCalledWith(mockNav)
    expect(h2).toHaveBeenCalledWith(mockNav)
  })

  it('unsubscribing via returned function stops receiving', () => {
    const handler = vi.fn()
    const off = onNav(handler)
    off()
    emitNav(mockNav)
    expect(handler).not.toHaveBeenCalled()
  })

  it('unsubscribing one handler does not affect others', () => {
    const h1 = vi.fn()
    const h2 = vi.fn()
    const off1 = onNav(h1)
    onNav(h2)
    off1()
    emitNav(mockNav)
    expect(h1).not.toHaveBeenCalled()
    expect(h2).toHaveBeenCalledWith(mockNav)
  })

  it('resetBus clears all handlers', () => {
    const handler = vi.fn()
    onNav(handler)
    resetBus()
    emitNav(mockNav)
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('onScreen', () => {
  beforeEach(() => { resetBus() })
  afterEach(() => { resetBus() })

  it('receives emitted screen registrations', () => {
    const handler = vi.fn()
    onScreen(handler)
    emitScreen(mockScreen)
    expect(handler).toHaveBeenCalledWith(mockScreen)
  })

  it('multiple handlers all receive the message', () => {
    const h1 = vi.fn()
    const h2 = vi.fn()
    onScreen(h1)
    onScreen(h2)
    emitScreen(mockScreen)
    expect(h1).toHaveBeenCalledWith(mockScreen)
    expect(h2).toHaveBeenCalledWith(mockScreen)
  })

  it('unsubscribing via returned function stops receiving', () => {
    const handler = vi.fn()
    const off = onScreen(handler)
    off()
    emitScreen(mockScreen)
    expect(handler).not.toHaveBeenCalled()
  })

  it('resetBus clears all handlers', () => {
    const handler = vi.fn()
    onScreen(handler)
    resetBus()
    emitScreen(mockScreen)
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('emitNav', () => {
  beforeEach(() => { resetBus() })
  afterEach(() => { resetBus() })

  it('works with push action', () => {
    const handler = vi.fn()
    onNav(handler)
    emitNav({ action: 'push', screen: 'settings' })
    expect(handler).toHaveBeenCalledWith({ action: 'push', screen: 'settings' })
  })

  it('works with back action', () => {
    const handler = vi.fn()
    onNav(handler)
    emitNav({ action: 'back' })
    expect(handler).toHaveBeenCalledWith({ action: 'back' })
  })

  it('works with home action', () => {
    const handler = vi.fn()
    onNav(handler)
    emitNav({ action: 'home' })
    expect(handler).toHaveBeenCalledWith({ action: 'home' })
  })

  it('works with lock action', () => {
    const handler = vi.fn()
    onNav(handler)
    emitNav({ action: 'lock' })
    expect(handler).toHaveBeenCalledWith({ action: 'lock' })
  })

  it('works with navigate action', () => {
    const handler = vi.fn()
    onNav(handler)
    emitNav({ action: 'navigate', screen: 'camera' })
    expect(handler).toHaveBeenCalledWith({ action: 'navigate', screen: 'camera' })
  })

  it('push includes screen property', () => {
    const handler = vi.fn()
    onNav(handler)
    emitNav({ action: 'push', screen: 'photos' })
    expect(handler.mock.calls[0][0].screen).toBe('photos')
  })

  it('navigate includes screen property', () => {
    const handler = vi.fn()
    onNav(handler)
    emitNav({ action: 'navigate', screen: 'maps' })
    expect(handler.mock.calls[0][0].screen).toBe('maps')
  })
})
