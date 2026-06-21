import { clamp, stripHtml } from '@/lib/connectors/utils'
import { parseDate } from './fetch-html'
import type { NormalizedEvent } from './types'
import { inferEventTypeFromTitle, isCareerRelatedEvent } from './utils'

const API = 'https://www.eventbriteapi.com/v3/events/search/'

const SEARCH_LOCATIONS = [
  'Bengaluru, India',
  'Mumbai, India',
  'New Delhi, India',
  'Hyderabad, India',
  'Chennai, India',
  'Pune, India',
  'Online, India',
]

interface EventbriteEvent {
  id: string
  name?: { text?: string }
  description?: { text?: string }
  url?: string
  start?: { utc?: string }
  end?: { utc?: string }
  online_event?: boolean
  venue?: {
    address?: {
      city?: string
      region?: string
      localized_area_display?: string
    }
  }
  organizer?: { name?: string }
}

function normalizeItem(raw: EventbriteEvent): NormalizedEvent | null {
  const title = (raw.name?.text || '').trim()
  if (!title || !raw.id) return null

  const description = stripHtml(raw.description?.text || '')
  if (!isCareerRelatedEvent(title, description)) return null

  const type = inferEventTypeFromTitle(title)
  if (!type) return null

  const startsAt = parseDate(raw.start?.utc) || new Date()
  const endsAt = parseDate(raw.end?.utc)
  const now = Date.now()
  if (endsAt && endsAt.getTime() < now) return null
  if (!endsAt && startsAt.getTime() < now) return null

  const isOnline = Boolean(raw.online_event)
  const city = raw.venue?.address?.city?.trim() || null
  const state = raw.venue?.address?.region?.trim() || null
  let location = 'India'
  if (isOnline) location = 'Online'
  else if (raw.venue?.address?.localized_area_display) location = raw.venue.address.localized_area_display
  else if (city && state) location = `${city}, ${state}`
  else if (city) location = `${city}, India`

  return {
    externalId: `eventbrite:${raw.id}`,
    title,
    organizer: raw.organizer?.name?.trim() || 'Organizer',
    type,
    city,
    state,
    location,
    isOnline,
    description: clamp(description, 3000),
    skills: [],
    url: raw.url || `https://www.eventbrite.com/e/${raw.id}`,
    source: 'eventbrite',
    startsAt,
    endsAt,
  }
}

async function fetchLocationEvents(token: string, location: string): Promise<EventbriteEvent[]> {
  const params = new URLSearchParams()
  params.set('location.address', location)
  params.set('location.within', '80km')
  params.set('expand', 'venue,organizer')
  params.set('start_date.range_start', new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'))
  params.set('categories', '101,102,108')
  params.set('q', 'hackathon OR career OR workshop OR networking OR job fair')

  const res = await fetch(`${API}?${params}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`Eventbrite "${location}" returned ${res.status}`)
  const json = await res.json()
  return Array.isArray(json.events) ? json.events : []
}

/** Career events from Eventbrite (requires EVENTBRITE_API_KEY). */
export async function fetchEventbriteEvents(): Promise<NormalizedEvent[]> {
  const token = process.env.EVENTBRITE_API_KEY?.trim()
  if (!token) return []

  const byId = new Map<string, NormalizedEvent>()
  for (const location of SEARCH_LOCATIONS) {
    try {
      const batch = await fetchLocationEvents(token, location)
      for (const raw of batch) {
        const normalized = normalizeItem(raw)
        if (normalized) byId.set(normalized.externalId, normalized)
      }
    } catch (err) {
      console.error(`[EVENTBRITE][${location}]`, err)
    }
  }
  return [...byId.values()]
}
