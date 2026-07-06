import type { Component } from 'vue'
import { shallowRef } from 'vue'
import type { ScreenId } from './types'

const _components = shallowRef<Partial<Record<ScreenId, Component>>>({})
export const screenComponents: Partial<Record<ScreenId, Component>> = {}

export function registerScreenComponents(components: Record<string, Component>): void {
  for (const [id, component] of Object.entries(components)) {
    screenComponents[id as ScreenId] = component
  }
  _components.value = { ...screenComponents }
}

export function getScreenComponent(id: ScreenId): Component | undefined {
  return _components.value[id]
}
