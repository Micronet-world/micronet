import type { ScreenMeta, NavIntent } from 'micronet-kernel'

export const meta: ScreenMeta = {
  id: 'lock', label: 'Lock Screen', color: '#faf9f6', icon: '🔒',
}

export const events: Record<string, NavIntent> = {
  unlock: { type: 'push', screen: 'home' },
  'go-camera': { type: 'push', screen: 'camera' },
}
