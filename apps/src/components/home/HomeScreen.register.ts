import type { ScreenMeta, NavIntent } from '@micronet/kernel'

export const meta: ScreenMeta = {
  id: 'home', label: 'Home', color: '#faf9f6', icon: '🏠',
}

export const events: Record<string, NavIntent> = {
  'go-lock': { type: 'lock' },
  'go-settings': { type: 'push', screen: 'settings' },
  'go-camera': { type: 'push', screen: 'camera' },
  'go-photos': { type: 'push', screen: 'photos' },
  'go-maps': { type: 'push', screen: 'maps' },
  'go-calendar': { type: 'push', screen: 'calendar' },
  'go-clock': { type: 'push', screen: 'clock' },
  'go-notes': { type: 'push', screen: 'notes' },
  'go-weather': { type: 'push', screen: 'weather' },
}
