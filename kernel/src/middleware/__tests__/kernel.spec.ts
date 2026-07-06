import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useKernelBridge } from '../kernel'
import { emitNav, resetBus } from '../bus'
import { resetRegistry } from '../registry'

function mountBridge() {
  let bridge: ReturnType<typeof useKernelBridge>
  const TestComponent = defineComponent({
    setup() {
      bridge = useKernelBridge()
      return bridge
    },
    render: () => h('div'),
  })
  const wrapper = mount(TestComponent)
  return { bridge: bridge!, wrapper }
}

describe('useKernelBridge', () => {
  beforeEach(() => {
    resetBus()
    resetRegistry()
  })

  afterEach(() => {
    resetBus()
    resetRegistry()
  })

  it('initial currentScreen is lock', () => {
    const { bridge } = mountBridge()
    expect(bridge.currentScreen.value).toBe('lock')
  })

  it('dispatches push intent when nav action is push', async () => {
    const { bridge } = mountBridge()
    emitNav({ action: 'push', screen: 'home' })
    await nextTick()
    expect(bridge.currentScreen.value).toBe('home')
  })

  it('dispatches lock intent when nav action is lock', async () => {
    const { bridge } = mountBridge()
    emitNav({ action: 'push', screen: 'home' })
    emitNav({ action: 'push', screen: 'settings' })
    emitNav({ action: 'lock' })
    await nextTick()
    expect(bridge.currentScreen.value).toBe('lock')
  })

  it('dispatches home intent when nav action is home', async () => {
    const { bridge } = mountBridge()
    emitNav({ action: 'push', screen: 'home' })
    emitNav({ action: 'push', screen: 'settings' })
    emitNav({ action: 'home' })
    await nextTick()
    expect(bridge.currentScreen.value).toBe('home')
  })

  it('dispatches back intent when nav action is back', async () => {
    const { bridge } = mountBridge()
    emitNav({ action: 'push', screen: 'home' })
    emitNav({ action: 'push', screen: 'settings' })
    emitNav({ action: 'back' })
    await nextTick()
    expect(bridge.currentScreen.value).toBe('home')
  })

  it('dispatches navigate intent when nav action is navigate', async () => {
    const { bridge } = mountBridge()
    emitNav({ action: 'push', screen: 'home' })
    emitNav({ action: 'push', screen: 'settings' })
    emitNav({ action: 'push', screen: 'camera' })
    emitNav({ action: 'navigate', screen: 'home' })
    await nextTick()
    expect(bridge.currentScreen.value).toBe('home')
  })

  it('cleans up nav handler on unmount', () => {
    const { wrapper, bridge } = mountBridge()
    wrapper.unmount()

    emitNav({ action: 'push', screen: 'home' })
    expect(bridge.currentScreen.value).toBe('lock')
  })
})
