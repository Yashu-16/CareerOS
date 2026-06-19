import type { NormalizedEvent } from './types'
import { EVENT_SOURCES } from './types'
import { fetchUnstopEvents } from './unstop'
import { fetchDevfolioEvents } from './devfolio'
import { fetchLumaEvents } from './luma'
import { fetchEventbriteEvents } from './eventbrite'

export { fetchUnstopEvents } from './unstop'
export { fetchDevfolioEvents } from './devfolio'
export { fetchLumaEvents } from './luma'
export { fetchEventbriteEvents } from './eventbrite'
export {
  matchesUserCity,
  isCareerRelatedEvent,
  mapUnstopEventType,
  inferEventTypeFromTitle,
  isUpcomingEvent,
  EVENT_TYPE_LABELS,
} from './utils'
export {
  EVENT_SOURCES,
  EVENT_SOURCE_LABELS,
  EVENT_AGGREGATOR_HOSTS,
  type EventSource,
  type NormalizedEvent,
} from './types'

const FETCHERS: Array<{ source: string; fn: () => Promise<NormalizedEvent[]> }> = [
  { source: 'unstop', fn: fetchUnstopEvents },
  { source: 'devfolio', fn: fetchDevfolioEvents },
  { source: 'luma', fn: fetchLumaEvents },
  { source: 'eventbrite', fn: fetchEventbriteEvents },
]

/** Fetch career events from every configured provider and de-duplicate. */
export async function fetchAllEvents(): Promise<NormalizedEvent[]> {
  const byId = new Map<string, NormalizedEvent>()

  await Promise.all(
    FETCHERS.map(async ({ source, fn }) => {
      try {
        for (const event of await fn()) {
          byId.set(event.externalId, event)
        }
      } catch (err) {
        console.error(`[EVENTS][${source}] fetch failed:`, err)
      }
    })
  )

  return [...byId.values()]
}

/** Deactivate stale listings per source after a sync run. */
export async function deactivateStaleEvents(
  prisma: {
    careerEvent: {
      updateMany: (args: {
        where: { source: string; externalId: { notIn: string[] }; isActive: boolean }
        data: { isActive: boolean }
      }) => Promise<unknown>
    }
  },
  events: NormalizedEvent[]
) {
  for (const source of EVENT_SOURCES) {
    const seen = events.filter((e) => e.source === source).map((e) => e.externalId)
    if (seen.length === 0) continue
    await prisma.careerEvent.updateMany({
      where: { source, externalId: { notIn: seen }, isActive: true },
      data: { isActive: false },
    })
  }
}
