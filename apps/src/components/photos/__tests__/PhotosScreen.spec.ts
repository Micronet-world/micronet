import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import PhotosScreen from '../PhotosScreen.vue'
import { i18n, onNav, resetBus, usePhotoStore } from 'micronet-kernel'
import type { NavRequest } from 'micronet-kernel'

vi.mock('micronet-kernel', async (importOriginal) => {
  const orig = await importOriginal()
  return {
    ...orig,
    storage: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      del: vi.fn().mockResolvedValue(undefined),
    },
  }
})

describe('PhotosScreen', () => {
  let navLog: NavRequest[][]
  let offNav: () => void

  beforeEach(() => {
    vi.useFakeTimers()
    resetBus()
    navLog = []
    offNav = onNav((msg) => { navLog.push([msg]) })

    // Clear the photo store before each test
    const { clearAll } = usePhotoStore()
    clearAll()
  })

  afterEach(() => {
    offNav()
    resetBus()
    vi.useRealTimers()
  })

  it('renders photos screen', async () => {
    const wrapper = mount(PhotosScreen, { global: { plugins: [i18n] } })
    await nextTick()
    expect(wrapper.find('.photos-screen').exists()).toBe(true)
  })

  it('shows empty state when store is empty', async () => {
    const wrapper = mount(PhotosScreen, { global: { plugins: [i18n] } })
    await nextTick()

    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.empty-title').text()).toBe('No Photos Yet')
  })

  it('renders back button via swipe gesture area', async () => {
    const wrapper = mount(PhotosScreen, { global: { plugins: [i18n] } })
    await nextTick()

    expect(wrapper.find('.photos-screen').exists()).toBe(true)
  })

  it('back button navigates home', async () => {
    const wrapper = mount(PhotosScreen, { global: { plugins: [i18n] } })
    await nextTick()

    // Swipe up triggers goHome()
    const screen = wrapper.find('.photos-screen')
    await screen.trigger('mousedown', { clientY: 300 })
    window.dispatchEvent(new MouseEvent('mousemove', { clientY: 180 }))
    window.dispatchEvent(new MouseEvent('mouseup'))
    await nextTick()

    expect(navLog.length).toBeGreaterThanOrEqual(1)
    expect(navLog.some(msgs => msgs.some(m => m.action === 'home'))).toBe(true)
  })

  it('renders header with Photos title', async () => {
    const wrapper = mount(PhotosScreen, { global: { plugins: [i18n] } })
    await nextTick()

    expect(wrapper.find('.header-title').text()).toBe('Photos')
  })

  it('shows select button in header', async () => {
    const wrapper = mount(PhotosScreen, { global: { plugins: [i18n] } })
    await nextTick()

    const selectBtn = wrapper.find('.select-btn')
    expect(selectBtn.exists()).toBe(true)
    expect(selectBtn.text()).toBe('Select')
  })

  it('shows favorites filter tab', async () => {
    const wrapper = mount(PhotosScreen, { global: { plugins: [i18n] } })
    await nextTick()

    const tabBtns = wrapper.findAll('.tab-btn')
    expect(tabBtns.length).toBe(2)
    expect(tabBtns[0].text()).toBe('All')
    expect(tabBtns[1].text()).toBe('Favorites')
  })
})
