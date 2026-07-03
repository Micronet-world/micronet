import { describe, it, expect } from 'vitest'
import { useScreenStack } from '../useScreenStack'

describe('useScreenStack', () => {
  it('starts on the lock screen with cards collapsed', () => {
    const { screenStack, currentScreen, cardsExpanded } = useScreenStack()
    expect(screenStack.value).toEqual(['lock'])
    expect(currentScreen.value).toBe('lock')
    expect(cardsExpanded.value).toBe(false)
  })

  it('push adds a screen to the top and collapses cards', () => {
    const { screenStack, currentScreen, cardsExpanded, dispatch } = useScreenStack()
    cardsExpanded.value = true
    dispatch({ type: 'push', screen: 'home' })
    expect(screenStack.value).toEqual(['lock', 'home'])
    expect(currentScreen.value).toBe('home')
    expect(cardsExpanded.value).toBe(false)
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

  it('show-cards expands and collapse retracts', () => {
    const { cardsExpanded, dispatch } = useScreenStack()
    dispatch({ type: 'show-cards' })
    expect(cardsExpanded.value).toBe(true)
    dispatch({ type: 'collapse' })
    expect(cardsExpanded.value).toBe(false)
  })

  it('navigation intents collapse an expanded card stack', () => {
    const { cardsExpanded, dispatch } = useScreenStack()
    dispatch({ type: 'show-cards' })
    dispatch({ type: 'push', screen: 'home' })
    expect(cardsExpanded.value).toBe(false)
  })
})
