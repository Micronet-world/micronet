import type { ScreenId, ScreenMeta, NavIntent, ScreenRegistration } from './types'
import { emitScreen } from './bus'

const screens = new Map<ScreenId, ScreenRegistration>()

export function registerScreen(
  meta: ScreenMeta,
  events: Record<string, NavIntent>,
) {
  screens.set(meta.id, { meta, events })
  emitScreen({ meta, events })
}

export function getRegisteredScreen(id: ScreenId): ScreenRegistration | undefined {
  return screens.get(id)
}

export function getRegisteredScreens(): ScreenRegistration[] {
  return [...screens.values()]
}

export function resetRegistry() {
  screens.clear()
}
