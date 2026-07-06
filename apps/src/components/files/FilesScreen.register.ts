import type { ScreenMeta, NavIntent } from '@micronet/kernel'

export const meta: ScreenMeta = {
  id: 'files', label: 'Files', color: '#faf9f6', icon: '📁',
}

export const events: Record<string, NavIntent> = {
  'go-back': { type: 'back' },
  'go-home': { type: 'home' },
}
