import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CalculatorScreen from '../CalculatorScreen.vue'
import { i18n, resetBus, onNav } from '@micronet/kernel'
import type { NavRequest } from '@micronet/kernel'

function mountScreen() {
  return mount(CalculatorScreen, {
    global: { plugins: [i18n] },
  })
}

describe('CalculatorScreen', () => {
  let navLog: NavRequest[][]
  let offNav: () => void

  beforeEach(() => {
    vi.useFakeTimers()
    resetBus()
    navLog = []
    offNav = onNav((msg) => { navLog.push([msg]) })
  })

  afterEach(() => {
    offNav()
    resetBus()
    vi.useRealTimers()
  })

  describe('Initial State', () => {
    it('renders the calculator screen', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.calculator-screen').exists()).toBe(true)
    })

    it('displays 0 initially', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.display-value').text()).toBe('0')
    })

    it('renders all digit buttons', () => {
      const wrapper = mountScreen()
      for (let i = 0; i <= 9; i++) {
        const btn = wrapper.findAll('.btn-digit').find(b => b.text() === String(i))
        expect(btn).toBeDefined()
      }
    })

    it('renders operator buttons', () => {
      const wrapper = mountScreen()
      expect(wrapper.findAll('.btn-operator')).toHaveLength(4)
    })

    it('renders function buttons', () => {
      const wrapper = mountScreen()
      expect(wrapper.findAll('.btn-function').length).toBeGreaterThanOrEqual(3)
    })

    it('renders equals button', () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.btn-equals').exists()).toBe(true)
    })
  })

  describe('Basic Arithmetic', () => {
    it('performs addition', async () => {
      const wrapper = mountScreen()
      await wrapper.findAll('.btn-digit').find(b => b.text() === '5')!.trigger('click')
      await wrapper.findAll('.btn-operator').find(b => b.text() === '+')!.trigger('click')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '3')!.trigger('click')
      await wrapper.find('.btn-equals').trigger('click')
      expect(wrapper.find('.display-value').text()).toBe('8')
    })

    it('performs subtraction', async () => {
      const wrapper = mountScreen()
      await wrapper.findAll('.btn-digit').find(b => b.text() === '9')!.trigger('click')
      await wrapper.findAll('.btn-operator').find(b => b.text() === '\u2212')!.trigger('click')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '4')!.trigger('click')
      await wrapper.find('.btn-equals').trigger('click')
      expect(wrapper.find('.display-value').text()).toBe('5')
    })

    it('performs multiplication', async () => {
      const wrapper = mountScreen()
      await wrapper.findAll('.btn-digit').find(b => b.text() === '6')!.trigger('click')
      await wrapper.findAll('.btn-operator').find(b => b.text() === '\u00D7')!.trigger('click')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '7')!.trigger('click')
      await wrapper.find('.btn-equals').trigger('click')
      expect(wrapper.find('.display-value').text()).toBe('42')
    })

    it('performs division', async () => {
      const wrapper = mountScreen()
      await wrapper.findAll('.btn-digit').find(b => b.text() === '8')!.trigger('click')
      await wrapper.findAll('.btn-operator').find(b => b.text() === '\u00F7')!.trigger('click')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '2')!.trigger('click')
      await wrapper.find('.btn-equals').trigger('click')
      expect(wrapper.find('.display-value').text()).toBe('4')
    })

    it('handles division by zero', async () => {
      const wrapper = mountScreen()
      await wrapper.findAll('.btn-digit').find(b => b.text() === '5')!.trigger('click')
      await wrapper.findAll('.btn-operator').find(b => b.text() === '\u00F7')!.trigger('click')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '0')!.trigger('click')
      await wrapper.find('.btn-equals').trigger('click')
      expect(wrapper.find('.display-value').text()).toBe('Error')
    })

    it('chains operations', async () => {
      const wrapper = mountScreen()
      await wrapper.findAll('.btn-digit').find(b => b.text() === '2')!.trigger('click')
      await wrapper.findAll('.btn-operator').find(b => b.text() === '+')!.trigger('click')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '3')!.trigger('click')
      await wrapper.findAll('.btn-operator').find(b => b.text() === '\u00D7')!.trigger('click')
      expect(wrapper.find('.display-value').text()).toBe('5')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '4')!.trigger('click')
      await wrapper.find('.btn-equals').trigger('click')
      expect(wrapper.find('.display-value').text()).toBe('20')
    })
  })

  describe('Special Functions', () => {
    it('clears all with AC', async () => {
      const wrapper = mountScreen()
      await wrapper.findAll('.btn-digit').find(b => b.text() === '5')!.trigger('click')
      await wrapper.findAll('.btn-operator').find(b => b.text() === '+')!.trigger('click')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '3')!.trigger('click')
      const acBtn = wrapper.findAll('.btn-function').find(b => b.text().includes('C'))
      await acBtn!.trigger('click')
      expect(wrapper.find('.display-value').text()).toBe('0')
    })

    it('toggles sign', async () => {
      const wrapper = mountScreen()
      await wrapper.findAll('.btn-digit').find(b => b.text() === '5')!.trigger('click')
      const signBtn = wrapper.findAll('.btn-function').find(b => b.text().includes('+'))
      await signBtn!.trigger('click')
      expect(wrapper.find('.display-value').text()).toBe('-5')
    })

    it('calculates percentage', async () => {
      const wrapper = mountScreen()
      await wrapper.findAll('.btn-digit').find(b => b.text() === '5')!.trigger('click')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '0')!.trigger('click')
      const pctBtn = wrapper.findAll('.btn-function').find(b => b.text() === '%')
      await pctBtn!.trigger('click')
      expect(wrapper.find('.display-value').text()).toBe('0.5')
    })

    it('handles decimal point', async () => {
      const wrapper = mountScreen()
      await wrapper.findAll('.btn-digit').find(b => b.text() === '3')!.trigger('click')
      const dotBtn = wrapper.findAll('.btn-digit').find(b => b.text() === '.')
      await dotBtn!.trigger('click')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '1')!.trigger('click')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '4')!.trigger('click')
      expect(wrapper.find('.display-value').text()).toBe('3.14')
    })

    it('prevents multiple decimal points', async () => {
      const wrapper = mountScreen()
      await wrapper.findAll('.btn-digit').find(b => b.text() === '3')!.trigger('click')
      const dotBtn = wrapper.findAll('.btn-digit').find(b => b.text() === '.')
      await dotBtn!.trigger('click')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '1')!.trigger('click')
      await dotBtn!.trigger('click')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '4')!.trigger('click')
      expect(wrapper.find('.display-value').text()).toBe('3.14')
    })
  })

  describe('Display Formatting', () => {
    it('formats large numbers with commas', async () => {
      const wrapper = mountScreen()
      await wrapper.findAll('.btn-digit').find(b => b.text() === '1')!.trigger('click')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '0')!.trigger('click')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '0')!.trigger('click')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '0')!.trigger('click')
      expect(wrapper.find('.display-value').text()).toBe('1,000')
    })

    it('shows expression display', async () => {
      const wrapper = mountScreen()
      await wrapper.findAll('.btn-digit').find(b => b.text() === '5')!.trigger('click')
      await wrapper.findAll('.btn-operator').find(b => b.text() === '+')!.trigger('click')
      expect(wrapper.find('.expression').text()).toContain('5')
      expect(wrapper.find('.expression').text()).toContain('+')
    })
  })

  describe('History', () => {
    it('toggles history panel', async () => {
      const wrapper = mountScreen()
      await wrapper.find('.history-toggle').trigger('click')
      expect(wrapper.find('.history-panel').exists()).toBe(true)
      await wrapper.find('.history-toggle').trigger('click')
      expect(wrapper.find('.history-panel').exists()).toBe(false)
    })

    it('shows no history message when empty', async () => {
      const wrapper = mountScreen()
      await wrapper.find('.history-toggle').trigger('click')
      expect(wrapper.find('.history-empty').exists()).toBe(true)
    })

    it('adds calculation to history', async () => {
      const wrapper = mountScreen()
      await wrapper.findAll('.btn-digit').find(b => b.text() === '5')!.trigger('click')
      await wrapper.findAll('.btn-operator').find(b => b.text() === '+')!.trigger('click')
      await wrapper.findAll('.btn-digit').find(b => b.text() === '3')!.trigger('click')
      await wrapper.find('.btn-equals').trigger('click')
      await wrapper.find('.history-toggle').trigger('click')
      expect(wrapper.findAll('.history-item')).toHaveLength(1)
    })
  })

  describe('Scientific Mode', () => {
    it('toggles scientific mode', async () => {
      const wrapper = mountScreen()
      expect(wrapper.find('.scientific-grid').exists()).toBe(false)
      await wrapper.find('.mode-toggle').trigger('click')
      expect(wrapper.find('.scientific-grid').exists()).toBe(true)
      await wrapper.find('.mode-toggle').trigger('click')
      expect(wrapper.find('.scientific-grid').exists()).toBe(false)
    })

    it('renders scientific buttons', async () => {
      const wrapper = mountScreen()
      await wrapper.find('.mode-toggle').trigger('click')
      expect(wrapper.findAll('.btn-sci').length).toBeGreaterThanOrEqual(12)
    })
  })

  describe('Navigation', () => {
    it('navigates back on swipe right', async () => {
      const wrapper = mountScreen()
      const screen = wrapper.find('.calculator-screen')
      await screen.trigger('mousedown', { clientX: 50 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 250 }))
      window.dispatchEvent(new MouseEvent('mouseup'))
      expect(navLog).toHaveLength(1)
      expect(navLog[0][0]).toEqual({ action: 'back' })
    })

    it('navigates home on swipe up on home bar', async () => {
      const wrapper = mountScreen()
      const bar = wrapper.find('.home-bar-area')
      await bar.trigger('mousedown', { clientY: 300 })
      window.dispatchEvent(new MouseEvent('mousemove', { clientY: 220 }))
      window.dispatchEvent(new MouseEvent('mouseup'))
      expect(navLog).toHaveLength(1)
      expect(navLog[0][0]).toEqual({ action: 'home' })
    })
  })
})
