import type { ScreenMeta, NavIntent } from 'micronet-kernel'

export const meta: ScreenMeta = {
  id: 'camera', label: 'Camera', color: '#1a1a1a', icon: '📷',
}

export const events: Record<string, NavIntent> = {
  'go-back': { type: 'back' },
  'go-home': { type: 'home' },
}
