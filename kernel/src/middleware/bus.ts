import type { NavRequest, ScreenRegistration } from './types'

type Handler<T> = (msg: T) => void

const navHandlers = new Set<Handler<NavRequest>>()
const screenHandlers = new Set<Handler<ScreenRegistration>>()

export function emitNav(msg: NavRequest) {
  for (const h of navHandlers) h(msg)
}

export function emitScreen(reg: ScreenRegistration) {
  for (const h of screenHandlers) h(reg)
}

export function onNav(handler: Handler<NavRequest>): () => void {
  navHandlers.add(handler)
  return () => { navHandlers.delete(handler) }
}

export function onScreen(handler: Handler<ScreenRegistration>): () => void {
  screenHandlers.add(handler)
  return () => { screenHandlers.delete(handler) }
}

export function resetBus() {
  navHandlers.clear()
  screenHandlers.clear()
}
