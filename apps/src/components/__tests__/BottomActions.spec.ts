import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BottomActions from '../BottomActions.vue'
import { i18n, onNav, resetBus, type NavRequest } from '@micronet/kernel'

describe('BottomActions', () => {
  let navLog: NavRequest[][]
  let offNav: () => void

  beforeEach(() => {
    resetBus()
    navLog = []
    offNav = onNav((msg) => { navLog.push([msg]) })
  })

  afterEach(() => {
    offNav()
    resetBus()
  })

  it('renders two action buttons', () => {
    const wrapper = mount(BottomActions, { global: { plugins: [i18n] } })
    const buttons = wrapper.findAll('.action-btn')
    expect(buttons).toHaveLength(2)
  })

  it('flashlight button toggles active class on click', async () => {
    const wrapper = mount(BottomActions, { global: { plugins: [i18n] } })
    const buttons = wrapper.findAll('.action-btn')
    const flashlightBtn = buttons[0]

    expect(flashlightBtn.classes()).not.toContain('active')

    await flashlightBtn.trigger('click')
    expect(flashlightBtn.classes()).toContain('active')

    await flashlightBtn.trigger('click')
    expect(flashlightBtn.classes()).not.toContain('active')
  })

  it('camera button is always visible', () => {
    const wrapper = mount(BottomActions, { global: { plugins: [i18n] } })
    const buttons = wrapper.findAll('.action-btn')
    const cameraBtn = buttons[1]

    expect(cameraBtn.isVisible()).toBe(true)
    expect(cameraBtn.attributes('aria-label')).toBe('Camera')
  })

  it('flashlight icon SVG is rendered', () => {
    const wrapper = mount(BottomActions, { global: { plugins: [i18n] } })
    const buttons = wrapper.findAll('.action-btn')
    const flashlightBtn = buttons[0]

    expect(flashlightBtn.attributes('aria-label')).toBe('Flashlight')
    expect(flashlightBtn.find('svg').exists()).toBe(true)
  })

  it('camera icon SVG is rendered', () => {
    const wrapper = mount(BottomActions, { global: { plugins: [i18n] } })
    const buttons = wrapper.findAll('.action-btn')
    const cameraBtn = buttons[1]

    expect(cameraBtn.find('svg').exists()).toBe(true)
  })
})
