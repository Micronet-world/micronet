import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SwipeIndicator from '../SwipeIndicator.vue'

describe('SwipeIndicator', () => {
  it('renders the indicator element', () => {
    const wrapper = mount(SwipeIndicator)
    expect(wrapper.find('.swipe-indicator').exists()).toBe(true)
    expect(wrapper.find('.bar').exists()).toBe(true)
  })

  it('has the correct CSS class', () => {
    const wrapper = mount(SwipeIndicator)
    expect(wrapper.find('.swipe-indicator').classes()).toContain('swipe-indicator')
    expect(wrapper.find('.bar').classes()).toContain('bar')
  })
})
