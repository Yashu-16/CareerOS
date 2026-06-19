import { EVENT_AGGREGATOR_HOSTS, EVENT_SOURCE_LABELS, type EventSource } from '@/lib/events'

export function eventSourceMeta(
  source?: string,
  url?: string
): { label: string; direct: boolean } | null {
  if (!source) return null

  let direct = false
  if (url) {
    try {
      const host = new URL(url).hostname.replace(/^www\./, '')
      direct = !EVENT_AGGREGATOR_HOSTS.has(host) && !EVENT_AGGREGATOR_HOSTS.has(`www.${host}`)
    } catch {
      direct = false
    }
  }

  const platformLabel =
    EVENT_SOURCE_LABELS[source as EventSource] ??
    source.charAt(0).toUpperCase() + source.slice(1)

  if (direct) return { label: 'Direct from organizer', direct: true }
  return { label: platformLabel, direct: false }
}
