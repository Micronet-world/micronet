import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CardStackManager from '../CardStackManager.vue'

type Screen = 'lock' | 'home' | 'settings' | 'camera' | 'photos'

describe('CardStackManager', () => {
  const createWrapper = (screenStack: Screen[], currentScreen: Screen, expanded = false) => {
    return mount(CardStackManager, {
      props: { screenStack, currentScreen, expanded },
      slots: {
        default: '<div class="slot-content">Current Screen</div>',
      },
    })
  }

  it('renders the slot content (current screen)', () => {
    const wrapper = createWrapper(['lock', 'home'], 'home')
    expect(wrapper.find('.current-screen').exists()).toBe(true)
    expect(wrapper.find('.slot-content').text()).toBe('Current Screen')
  })

  it('renders no background cards when only lock screen in stack', () => {
    const wrapper = createWrapper(['lock'], 'lock')
    expect(wrapper.findAll('.background-card')).toHaveLength(0)
  })

  it('renders no background cards for lock-only stack', () => {
    const wrapper = createWrapper(['lock', 'home'], 'home')
    expect(wrapper.findAll('.background-card')).toHaveLength(0)
  })

  it('renders background card for settings behind home', () => {
    const wrapper = createWrapper(['lock', 'home', 'settings'], 'settings')
    const cards = wrapper.findAll('.background-card')
    expect(cards).toHaveLength(1)
    expect(cards[0].find('.card-label').text()).toBe('Home')
  })

  it('renders multiple background cards', () => {
    const wrapper = createWrapper(
      ['lock', 'home', 'settings', 'camera'],
      'camera'
    )
    const cards = wrapper.findAll('.background-card')
    expect(cards).toHaveLength(2)
    expect(cards[0].find('.card-label').text()).toBe('Settings')
    expect(cards[1].find('.card-label').text()).toBe('Home')
  })

  it('limits visible cards to 3', () => {
    const wrapper = createWrapper(
      ['lock', 'home', 'settings', 'camera', 'photos'],
      'photos'
    )
    const cards = wrapper.findAll('.background-card')
    expect(cards).toHaveLength(3)
  })

  it('applies correct depth classes', () => {
    const wrapper = createWrapper(
      ['lock', 'home', 'settings', 'camera'],
      'camera'
    )
    const cards = wrapper.findAll('.background-card')
    expect(cards[0].classes()).toContain('depth-0')
    expect(cards[1].classes()).toContain('depth-1')
  })

  it('emits navigate-to when background card clicked', async () => {
    const wrapper = createWrapper(
      ['lock', 'home', 'settings'],
      'settings'
    )
    const card = wrapper.find('.background-card')
    await card.trigger('click')
    expect(wrapper.emitted('navigate-to')).toHaveLength(1)
    expect(wrapper.emitted('navigate-to')![0]).toEqual(['home'])
  })

  it('does not render backdrop when not expanded', () => {
    const wrapper = createWrapper(
      ['lock', 'home', 'settings'],
      'settings',
      false
    )
    expect(wrapper.find('.backdrop').exists()).toBe(false)
  })

  it('renders backdrop when expanded with cards', () => {
    const wrapper = createWrapper(
      ['lock', 'home', 'settings'],
      'settings',
      true
    )
    expect(wrapper.find('.backdrop').exists()).toBe(true)
  })

  it('does not render backdrop when expanded but no cards', () => {
    const wrapper = createWrapper(['lock', 'home'], 'home', true)
    expect(wrapper.find('.backdrop').exists()).toBe(false)
  })

  it('applies expanded class to cards when expanded', () => {
    const wrapper = createWrapper(
      ['lock', 'home', 'settings'],
      'settings',
      true
    )
    const cards = wrapper.findAll('.background-card')
    expect(cards[0].classes()).toContain('expanded')
  })

  it('does not apply expanded class when collapsed', () => {
    const wrapper = createWrapper(
      ['lock', 'home', 'settings'],
      'settings',
      false
    )
    const cards = wrapper.findAll('.background-card')
    expect(cards[0].classes()).not.toContain('expanded')
  })

  it('applies expanded class to current-screen when expanded', () => {
    const wrapper = createWrapper(
      ['lock', 'home', 'settings'],
      'settings',
      true
    )
    expect(wrapper.find('.current-screen').classes()).toContain('expanded')
  })

  it('emits collapse when backdrop clicked', async () => {
    const wrapper = createWrapper(
      ['lock', 'home', 'settings'],
      'settings',
      true
    )
    await wrapper.find('.backdrop').trigger('click')
    expect(wrapper.emitted('collapse')).toHaveLength(1)
  })

  it('renders card preview with icon and label', () => {
    const wrapper = createWrapper(
      ['lock', 'home', 'settings'],
      'settings'
    )
    const card = wrapper.find('.background-card')
    expect(card.find('.card-icon').exists()).toBe(true)
    expect(card.find('.card-label').text()).toBe('Home')
  })

  it('renders placeholder lines in card body', () => {
    const wrapper = createWrapper(
      ['lock', 'home', 'settings'],
      'settings'
    )
    const card = wrapper.find('.background-card')
    const lines = card.findAll('.card-placeholder-line')
    expect(lines.length).toBeGreaterThan(0)
  })

  it('handles photos screen type', () => {
    const wrapper = createWrapper(
      ['lock', 'home', 'photos'],
      'photos'
    )
    const cards = wrapper.findAll('.background-card')
    expect(cards).toHaveLength(1)
    expect(cards[0].find('.card-label').text()).toBe('Home')
  })

  it('has-cards class applied when cards exist', () => {
    const wrapper = createWrapper(
      ['lock', 'home', 'settings'],
      'settings'
    )
    expect(wrapper.find('.card-stack').classes()).toContain('has-cards')
  })

  it('has-cards class not applied when no cards', () => {
    const wrapper = createWrapper(['lock'], 'lock')
    expect(wrapper.find('.card-stack').classes()).not.toContain('has-cards')
  })
})
