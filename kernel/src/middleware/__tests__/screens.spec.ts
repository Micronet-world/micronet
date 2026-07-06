import { describe, it, expect, beforeEach } from 'vitest'
import { defineComponent, h } from 'vue'
import { registerScreenComponents, getScreenComponent, screenComponents } from '../screens'

const CompA = defineComponent({ name: 'CompA', render: () => h('div', 'A') })
const CompB = defineComponent({ name: 'CompB', render: () => h('div', 'B') })

describe('screens', () => {
  beforeEach(() => {
    for (const key of Object.keys(screenComponents)) {
      delete screenComponents[key as keyof typeof screenComponents]
    }
  })

  it('registerScreenComponents registers components', () => {
    registerScreenComponents({ lock: CompA })
    expect(getScreenComponent('lock')).toBe(CompA)
  })

  it('getScreenComponent returns the registered component', () => {
    registerScreenComponents({ home: CompB })
    expect(getScreenComponent('home')).toBe(CompB)
  })

  it('getScreenComponent returns undefined for unregistered id', () => {
    expect(getScreenComponent('photos')).toBeUndefined()
  })

  it('registering new components merges with existing ones', () => {
    registerScreenComponents({ lock: CompA })
    registerScreenComponents({ home: CompB })
    expect(getScreenComponent('lock')).toBe(CompA)
    expect(getScreenComponent('home')).toBe(CompB)
  })

  it('registering the same id overwrites the previous component', () => {
    registerScreenComponents({ lock: CompA })
    registerScreenComponents({ lock: CompB })
    expect(getScreenComponent('lock')).toBe(CompB)
  })
})
