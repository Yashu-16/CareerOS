import { clamp } from '@/lib/connectors/utils'
import { parseDate } from './fetch-html'
import type { NormalizedEvent } from './types'
import { inferEventTypeFromTitle, isCareerRelatedEvent } from './utils'

const BASE = 'https://api.luma.com/discover/get-paginated-events'

/** Major Indian tech hubs — queried so offline events surface outside one metro. */
const INDIAN_HUBS = [
  { city: 'Bengaluru', lat: 12.9716, lng: 77.5946 },
  { city: 'Mumbai', lat: 19.076, lng: 72.8777 },
  { city: 'New Delhi', lat: 28.6139, lng: 77.209 },
  { city: 'Hyderabad', lat: 17.385, lng: 78.4867 },
  { city: 'Chennai', lat: 13.0827, lng: 80.2707 },
  { city: 'Pune', lat: 18.5204, lng: 73.8567 },
  { city: 'Kolkata', lat: 22.5726, lng: 88.3639 },
  { city: 'Gurugram', lat: 28.4595, lng: 77.0266 },
] as const

interface LumaEntry {
  api_id: string
  event: {
    api_id: string
    name: string
    start_at: string
    end_at: string
    url: string
    location_type?: string
    geo_address_info?: {
      city?: string
      region?: string
      country?: string
      country_code?: string
      city_state?: string
      full_address?: string
    }
    virtual_info?: { has_access?: boolean }
  }
  calendar?: { name?: string; website?: string | null }
  hosts?: Array<{ name?: string; website?: string | null }>
  registration_availability?: string
}

async function fetchHubPage(
  lat: number,
  lng: number,
  cursor?: string
): Promise<{ entries: LumaEntry[]; nextCursor?: string }> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    pagination_limit: '50',
  })
  if (cursor) params.set('pagination_cursor', cursor)

  const res = await fetch(`${BASE}?${params}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'CareerOS/1.0' },
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`Luma returned ${res.status}`)
  const json = await res.json()
  return {
    entries: Array.isArray(json.entries) ? json.entries : [],
    nextCursor: json.has_more ? json.next_cursor : undefined,
  }
}

function normalizeItem(raw: LumaEntry): NormalizedEvent | null {
  const ev = raw.event
  const title = (ev?.name || '').trim()
  if (!title || !ev?.api_id) return null

  const host = raw.hosts?.[0]
  const organizer =
    host?.name?.trim() ||
    raw.calendar?.name?.trim() ||
    'Organizer'

  const description = host?.website ? `Hosted by ${organizer}` : organizer
  if (!isCareerRelatedEvent(title, description)) return null

  const type = inferEventTypeFromTitle(title)
  if (!type) return null

  const geo = ev.geo_address_info
  const isOnline =
    ev.location_type === 'online' ||
    ev.location_type === 'virtual' ||
    Boolean(ev.virtual_info?.has_access)

  const countryCode = geo?.country_code?.toUpperCase()
  if (!isOnline && countryCode && countryCode !== 'IN') return null

  const city = geo?.city?.trim() || null
  const state = geo?.region?.trim() || null
  let location = 'India'
  if (isOnline) location = 'Online'
  else if (geo?.city_state) location = geo.city_state
  else if (city && state) location = `${city}, ${state}`
  else if (city) location = `${city}, India`
  else if (geo?.full_address) location = geo.full_address

  const startsAt = parseDate(ev.start_at) || new Date()
  const endsAt = parseDate(ev.end_at)

  const now = Date.now()
  if (endsAt && endsAt.getTime() < now) return null
  if (!endsAt && startsAt.getTime() < now) return null

  if (raw.registration_availability === 'closed') return null

  const slug = ev.url?.trim()
  const url = slug ? `https://lu.ma/${slug}` : `https://lu.ma/event/${ev.api_id}`

  return {
    externalId: `luma:${ev.api_id}`,
    title,
    organizer,
    type,
    city,
    state,
    location,
    isOnline,
    description: clamp(description, 3000),
    skills: [],
    url,
    source: 'luma',
    startsAt,
    endsAt,
  }
}

/** Tech/career meetups and hackathons from Luma (lu.ma) across Indian hubs. */
export async function fetchLumaEvents(): Promise<NormalizedEvent[]> {
  const byId = new Map<string, NormalizedEvent>()

  for (const hub of INDIAN_HUBS) {
    let cursor: string | undefined
    let pages = 0
    do {
      try {
        const { entries, nextCursor } = await fetchHubPage(hub.lat, hub.lng, cursor)
        for (const entry of entries) {
          const normalized = normalizeItem(entry)
          if (normalized) byId.set(normalized.externalId, normalized)
        }
        cursor = nextCursor
        pages++
      } catch (err) {
        console.error(`[LUMA][${hub.city}]`, err)
        break
      }
    } while (cursor && pages < 3)
  }

  return [...byId.values()]
}
