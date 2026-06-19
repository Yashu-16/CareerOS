import type { NormalizedEvent } from './unstop'
import { fetchUnstopEvents } from './unstop'

export { fetchUnstopEvents } from './unstop'
export { matchesUserCity, isCareerRelatedEvent, mapUnstopEventType, EVENT_TYPE_LABELS } from './utils'
export type { NormalizedEvent }

/** Fetch career events from every configured provider and de-duplicate. */
export async function fetchAllEvents(): Promise<NormalizedEvent[]> {
  const byId = new Map<string, NormalizedEvent>()

  try {
    for (const event of await fetchUnstopEvents()) {
      byId.set(event.externalId, event)
    }
  } catch (err) {
    console.error('[EVENTS] Unstop fetch failed:', err)
  }

  return [...byId.values()]
}
