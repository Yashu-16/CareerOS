import { clamp } from '@/lib/connectors/utils'
import { fetchNextData, parseDate } from './fetch-html'
import type { NormalizedEvent } from './types'
import { inferEventTypeFromTitle, isCareerRelatedEvent } from './utils'

const LIST_URL = 'https://devfolio.co/hackathons'

interface DevfolioHackathon {
  uuid: string
  slug: string
  name: string
  type?: string
  starts_at?: string
  ends_at?: string
  is_online?: boolean
  themes?: Array<{ theme?: { name?: string } }>
  settings?: {
    reg_ends_at?: string
    reg_starts_at?: string
    site?: string
    external_apply_url?: string | null
  }
}

function organizerFromTitle(title: string): string {
  const dash = title.split(' - ')[0]?.trim()
  return dash && dash.length < 80 ? dash : 'Organizer'
}

function cityFromTitle(title: string): string | null {
  const cities = [
    'Bengaluru',
    'Bangalore',
    'Mumbai',
    'Delhi',
    'New Delhi',
    'Hyderabad',
    'Chennai',
    'Pune',
    'Kolkata',
    'Gurugram',
    'Gurgaon',
    'Noida',
    'Jaipur',
    'Ahmedabad',
    'Kochi',
    'Indore',
  ]
  const lower = title.toLowerCase()
  return cities.find((c) => lower.includes(c.toLowerCase())) || null
}

function normalizeItem(raw: DevfolioHackathon): NormalizedEvent | null {
  const title = (raw.name || '').trim()
  if (!title || !raw.uuid) return null

  const type = inferEventTypeFromTitle(title, { defaultType: 'HACKATHON' })
  if (!type) return null
  if (!isCareerRelatedEvent(title, '')) return null

  const regEnds = parseDate(raw.settings?.reg_ends_at)
  const eventEnds = parseDate(raw.ends_at)
  const startsAt = parseDate(raw.settings?.reg_starts_at) || parseDate(raw.starts_at) || new Date()
  const endsAt = regEnds || eventEnds

  const now = Date.now()
  if (regEnds && regEnds.getTime() < now) return null
  if (!regEnds && eventEnds && eventEnds.getTime() < now) return null

  const isOnline = Boolean(raw.is_online)
  const city = cityFromTitle(title)
  const location = isOnline ? 'Online' : city ? `${city}, India` : 'India'

  const directUrl =
    raw.settings?.external_apply_url?.trim() ||
    raw.settings?.site?.trim() ||
    `https://devfolio.co/${raw.slug}`

  const themes = (raw.themes || [])
    .map((t) => t.theme?.name)
    .filter((n): n is string => Boolean(n && n !== 'No Restrictions'))

  return {
    externalId: `devfolio:${raw.uuid}`,
    title,
    organizer: organizerFromTitle(title),
    type,
    city,
    state: null,
    location,
    isOnline,
    description: clamp(themes.length ? `Themes: ${themes.join(', ')}` : '', 3000),
    skills: themes.slice(0, 10),
    url: directUrl,
    source: 'devfolio',
    startsAt,
    endsAt,
  }
}

/** Open and upcoming hackathons from Devfolio (links prefer organizer sites when listed). */
export async function fetchDevfolioEvents(): Promise<NormalizedEvent[]> {
  const next = await fetchNextData(LIST_URL)
  const data =
    next?.props?.pageProps?.dehydratedState?.queries?.find(
      (q: any) => q.state?.data?.open_hackathons
    )?.state?.data || {}

  const combined: DevfolioHackathon[] = [
    ...(Array.isArray(data.open_hackathons) ? data.open_hackathons : []),
    ...(Array.isArray(data.upcoming_hackathons) ? data.upcoming_hackathons : []),
  ]

  const byId = new Map<string, NormalizedEvent>()
  for (const raw of combined) {
    const normalized = normalizeItem(raw)
    if (normalized) byId.set(normalized.externalId, normalized)
  }
  return [...byId.values()]
}
