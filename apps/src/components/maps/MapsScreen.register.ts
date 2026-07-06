import type { ScreenMeta, NavIntent } from '@micronet/kernel'

export const meta: ScreenMeta = {
  id: 'maps', label: 'Maps', color: '#e8f0fe', icon: '🗺️',
}

export const events: Record<string, NavIntent> = {
  'go-back': { type: 'back' },
  'go-home': { type: 'home' },
}
