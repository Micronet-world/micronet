import type { ScreenMeta, NavIntent } from '@micronet/kernel'

export const meta: ScreenMeta = {
  id: 'settings', label: 'Settings', color: '#f5f3ef', icon: '⚙️',
}

export const events: Record<string, NavIntent> = {
  'go-lock': { type: 'lock' },
  'go-back': { type: 'back' },
  'go-home': { type: 'home' },
}
