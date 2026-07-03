import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BottomActions from '../BottomActions.vue'

describe('BottomActions', () => {
  it('renders flashlight and camera buttons', () => {
    const wrapper = mount(BottomActions)
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(2)
  })

  it('flashlight starts in off state', () => {
    const wrapper = mount(BottomActions)
    const flashlight = wrapper.find('[aria-label="Flashlight"]')
    expect(flashlight.classes()).not.toContain('active')
  })

  it('toggles flashlight active class on click', async () => {
    const wrapper = mount(BottomActions)
    const flashlight = wrapper.find('[aria-label="Flashlight"]')

    await flashlight.trigger('click')
    expect(flashlight.classes()).toContain('active')

    await flashlight.trigger('click')
    expect(flashlight.classes()).not.toContain('active')
  })

  it('camera button does not have active class', () => {
    const wrapper = mount(BottomActions)
    const camera = wrapper.find('[aria-label="Camera"]')
    expect(camera.classes()).not.toContain('active')
  })

  it('buttons have correct aria-labels', () => {
    const wrapper = mount(BottomActions)
    expect(wrapper.find('[aria-label="Flashlight"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Camera"]').exists()).toBe(true)
  })

  it('flashlight button contains an SVG', () => {
    const wrapper = mount(BottomActions)
    const flashlight = wrapper.find('[aria-label="Flashlight"]')
    expect(flashlight.find('svg').exists()).toBe(true)
  })

  it('camera button contains an SVG', () => {
    const wrapper = mount(BottomActions)
    const camera = wrapper.find('[aria-label="Camera"]')
    expect(camera.find('svg').exists()).toBe(true)
  })
})
