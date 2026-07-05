import type { Component } from 'vue'

export type ScreenId = 'lock' | 'home' | 'settings' | 'camera' | 'photos'

export interface ScreenMeta {
  id: ScreenId
  label: string
  color: string
  icon: string
}

export type NavIntent =
  | { type: 'push'; screen: ScreenId }
  | { type: 'lock' }
  | { type: 'home' }
  | { type: 'back' }
  | { type: 'navigate'; screen: ScreenId }

export interface ScreenPlugin extends ScreenMeta {
  component: Component
  events: Record<string, NavIntent>
}
