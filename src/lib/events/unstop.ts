import type { EventType } from '@prisma/client'
import { stripHtml, clamp } from '@/lib/connectors/utils'
import { isCareerRelatedEvent, mapUnstopEventType } from './utils'

const BASE = 'https://unstop.com/api/public/opportunity/search-result'

export interface NormalizedEvent {
  externalId: string
  title: string
  organizer: string
  type: EventType
  city: string | null
  state: string | null
  location: string
  isOnline: boolean
  description: string
  skills: string[]
  url: string
  source: string
  startsAt: Date
  endsAt: Date | null
}

const SYNC_PLAN: Array<{ opportunity: string; pages: number }> = [
  { opportunity: 'hackathons', pages: 4 },
  { opportunity: 'workshops', pages: 3 },
  { opportunity: 'conferences', pages: 3 },
  { opportunity: 'hiring-challenges', pages: 2 },
  { opportunity: 'competitions', pages: 3 },
]

async function fetchPage(opportunity: string, page: number): Promise<any[]> {
  const url = `${BASE}?opportunity=${encodeURIComponent(opportunity)}&page=${page}&per_page=50&sortBy=&orderBy=`
  const res = await fetch(url, { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`Unstop "${opportunity}" page ${page} returned ${res.status}`)
  const json = await res.json()
  return Array.isArray(json?.data?.data) ? json.data.data : []
}

function parseDate(value?: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function normalizeItem(raw: any): NormalizedEvent | null {
  const title = (raw?.title || '').trim()
  if (!title || !raw?.id) return null

  const mappedType = mapUnstopEventType(raw)
  if (!mappedType) return null

  const details = raw.details || ''
  if (!isCareerRelatedEvent(title, details)) return null

  const addr = raw.address_with_country_logo
  const city = addr?.city?.trim() || null
  const state = addr?.state?.trim() || null
  const isOnline = (raw.region || '').toLowerCase() === 'online'
  const addressLine = addr?.address?.trim()

  let location = 'India'
  if (isOnline) location = 'Online'
  else if (city && state) location = `${city}, ${state}`
  else if (city) location = city
  else if (addressLine) location = addressLine
  else if (state) location = state

  const skills = Array.isArray(raw.required_skills)
    ? raw.required_skills.map((s: any) => s.skill || s.skill_name).filter(Boolean)
    : []

  const startsAt =
    parseDate(raw.regnRequirements?.start_regn_dt) ||
    parseDate(raw.approved_date) ||
    parseDate(raw.updated_at) ||
    new Date()

  const endsAt =
    parseDate(raw.end_date) ||
    parseDate(raw.regnRequirements?.end_regn_dt) ||
    null

  // Skip events that already ended.
  if (endsAt && endsAt.getTime() < Date.now() - 24 * 60 * 60 * 1000) return null

  const slug = raw.public_url || ''
  const url = raw.seo_url || (slug ? `https://unstop.com/${slug}` : 'https://unstop.com')

  return {
    externalId: `unstop:${raw.id}`,
    title,
    organizer: raw.organisation?.name || 'Organizer',
    type: mappedType,
    city,
    state,
    location,
    isOnline,
    description: clamp(stripHtml(details), 3000),
    skills: skills.slice(0, 20),
    url,
    source: 'unstop',
    startsAt,
    endsAt,
  }
}

/** Pull career events from Unstop (hackathons, workshops, conferences, etc.). */
export async function fetchUnstopEvents(): Promise<NormalizedEvent[]> {
  const byId = new Map<string, NormalizedEvent>()

  for (const { opportunity, pages } of SYNC_PLAN) {
    for (let page = 1; page <= pages; page++) {
      try {
        const batch = await fetchPage(opportunity, page)
        for (const raw of batch) {
          const normalized = normalizeItem(raw)
          if (normalized) byId.set(normalized.externalId, normalized)
        }
      } catch (err) {
        console.error(`[UNSTOP][${opportunity}] page ${page}:`, err)
      }
    }
  }

  return [...byId.values()]
}
