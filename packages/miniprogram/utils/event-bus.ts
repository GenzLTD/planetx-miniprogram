/**
 * Simple event bus for miniprogram.
 * Replaces setTimeout polling with proper pub/sub.
 */

type Handler = (...args: any[]) => void

const handlers: Record<string, Handler[]> = {}

export const eventBus = {
  on(event: string, handler: Handler) {
    if (!handlers[event]) handlers[event] = []
    handlers[event].push(handler)
  },

  off(event: string, handler: Handler) {
    if (!handlers[event]) return
    handlers[event] = handlers[event].filter((h) => h !== handler)
  },

  emit(event: string, ...args: any[]) {
    const list = handlers[event]
    if (!list) return
    list.forEach((h) => {
      try {
        h(...args)
      } catch (e) {
        console.error(`[eventBus] handler error for "${event}":`, e)
      }
    })
  },
}
