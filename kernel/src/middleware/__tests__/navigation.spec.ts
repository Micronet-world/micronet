import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useNavigation } from '../navigation'
import { onNav, resetBus } from '../bus'
import type { NavRequest } from '../types'

describe('useNavigation', () => {
  let navLog: NavRequest[]
  let offNav: () => void
  let nav: ReturnType<typeof useNavigation>

  beforeEach(() => {
    resetBus()
    navLog = []
    offNav = onNav((msg) => { navLog.push(msg) })
    nav = useNavigation()
  })

  afterEach(() => {
    offNav()
    resetBus()
  })

  it('goTo(screen) emits push action', () => {
    nav.goTo('home')
    expect(navLog).toEqual([{ action: 'push', screen: 'home' }])
  })

  it('goBack() emits back action', () => {
    nav.goBack()
    expect(navLog).toEqual([{ action: 'back' }])
  })

  it('goHome() emits home action', () => {
    nav.goHome()
    expect(navLog).toEqual([{ action: 'home' }])
  })

  it('lock() emits lock action', () => {
    nav.lock()
    expect(navLog).toEqual([{ action: 'lock' }])
  })

  it('navigate(screen) emits navigate action', () => {
    nav.navigate('settings')
    expect(navLog).toEqual([{ action: 'navigate', screen: 'settings' }])
  })
})
