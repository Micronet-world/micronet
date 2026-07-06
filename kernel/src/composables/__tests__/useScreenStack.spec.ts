import { describe, it, expect } from 'vitest'
import { useScreenStack } from '../useScreenStack'

describe('useScreenStack', () => {
  it('starts on the lock screen', () => {
    const { screenStack, currentScreen } = useScreenStack()
    expect(screenStack.value).toEqual(['lock'])
    expect(currentScreen.value).toBe('lock')
  })

  it('push adds a screen to the top', () => {
    const { screenStack, currentScreen, dispatch } = useScreenStack()
    dispatch({ type: 'push', screen: 'home' })
    expect(screenStack.value).toEqual(['lock', 'home'])
    expect(currentScreen.value).toBe('home')
  })

  it('lock resets the stack to just lock', () => {
    const { screenStack, currentScreen, dispatch } = useScreenStack()
    dispatch({ type: 'push', screen: 'home' })
    dispatch({ type: 'push', screen: 'settings' })
    dispatch({ type: 'lock' })
    expect(screenStack.value).toEqual(['lock'])
    expect(currentScreen.value).toBe('lock')
  })

  it('home trims the stack to lock+home', () => {
    const { screenStack, currentScreen, dispatch } = useScreenStack()
    dispatch({ type: 'push', screen: 'home' })
    dispatch({ type: 'push', screen: 'settings' })
    dispatch({ type: 'push', screen: 'camera' })
    dispatch({ type: 'home' })
    expect(screenStack.value).toEqual(['lock', 'home'])
    expect(currentScreen.value).toBe('home')
  })

  it('home is a no-op when already at lock+home', () => {
    const { screenStack, dispatch } = useScreenStack()
    dispatch({ type: 'push', screen: 'home' })
    dispatch({ type: 'home' })
    expect(screenStack.value).toEqual(['lock', 'home'])
  })

  it('home reveals home when an app was opened from lock (no home in stack)', () => {
    // Camera is pushed straight from the lock screen: stack ['lock', 'camera']
    const { screenStack, currentScreen, dispatch } = useScreenStack()
    dispatch({ type: 'push', screen: 'camera' })
    expect(screenStack.value).toEqual(['lock', 'camera'])

    dispatch({ type: 'home' })
    expect(screenStack.value).toEqual(['lock', 'home'])
    expect(currentScreen.value).toBe('home')
  })

  it('back pops the top screen', () => {
    const { screenStack, currentScreen, dispatch } = useScreenStack()
    dispatch({ type: 'push', screen: 'home' })
    dispatch({ type: 'push', screen: 'settings' })
    dispatch({ type: 'back' })
    expect(screenStack.value).toEqual(['lock', 'home'])
    expect(currentScreen.value).toBe('home')
  })

  it('back is a no-op when only lock+home remain', () => {
    const { screenStack, dispatch } = useScreenStack()
    dispatch({ type: 'push', screen: 'home' })
    dispatch({ type: 'back' })
    expect(screenStack.value).toEqual(['lock', 'home'])
  })

  it('back returns to lock when an app was opened from lock (no home in stack)', () => {
    const { screenStack, currentScreen, dispatch } = useScreenStack()
    dispatch({ type: 'push', screen: 'camera' })
    expect(screenStack.value).toEqual(['lock', 'camera'])

    dispatch({ type: 'back' })
    expect(screenStack.value).toEqual(['lock'])
    expect(currentScreen.value).toBe('lock')
  })

  it('navigate trims the stack to the target screen', () => {
    const { screenStack, currentScreen, dispatch } = useScreenStack()
    dispatch({ type: 'push', screen: 'home' })
    dispatch({ type: 'push', screen: 'settings' })
    dispatch({ type: 'push', screen: 'camera' })
    dispatch({ type: 'navigate', screen: 'home' })
    expect(screenStack.value).toEqual(['lock', 'home'])
    expect(currentScreen.value).toBe('home')
  })

  it('navigate to an unknown screen is a no-op', () => {
    const { screenStack, dispatch } = useScreenStack()
    dispatch({ type: 'push', screen: 'home' })
    dispatch({ type: 'navigate', screen: 'photos' })
    expect(screenStack.value).toEqual(['lock', 'home'])
  })
})
