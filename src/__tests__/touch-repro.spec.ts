import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import App from '../App.vue'
import { i18n, setKernel, resetRegistry, resetBus } from '@micronet/kernel'
import { appEntries } from '@micronet/apps'
import { createKernelAPI } from '../kernel-setup'
import { loadAppsSync, clearLoadedApps } from '../app-loader'

describe('Touch-through-App repro', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    setKernel(createKernelAPI())
    clearLoadedApps()
    resetRegistry()
    resetBus()
    loadAppsSync(appEntries)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('touch swipe up on lock screen navigates to home (through full App)', async () => {
    const wrapper = mount(App, { global: { plugins: [i18n] } })
    const lock = wrapper.find('.lock-screen')
    expect(lock.exists()).toBe(true)

    lock.element.dispatchEvent(new TouchEvent('touchstart', {
      touches: [{ clientY: 300 } as Touch],
    }))
    lock.element.dispatchEvent(new TouchEvent('touchmove', {
      touches: [{ clientY: 200 } as Touch],
    }))
    lock.element.dispatchEvent(new TouchEvent('touchend', { touches: [] }))
    await nextTick()

    expect(wrapper.find('.lock-screen').exists()).toBe(false)
    expect(wrapper.find('.home-screen').exists()).toBe(true)
  })
})
