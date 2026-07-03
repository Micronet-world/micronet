import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SwipeIndicator from '../SwipeIndicator.vue'

describe('SwipeIndicator', () => {
  it('renders the swipe indicator container', () => {
    const wrapper = mount(SwipeIndicator)
    expect(wrapper.find('.swipe-indicator').exists()).toBe(true)
  })

  it('renders the bar element', () => {
    const wrapper = mount(SwipeIndicator)
    expect(wrapper.find('.bar').exists()).toBe(true)
  })

  it('bar is a child of swipe-indicator', () => {
    const wrapper = mount(SwipeIndicator)
    const indicator = wrapper.find('.swipe-indicator')
    expect(indicator.find('.bar').exists()).toBe(true)
  })
})
