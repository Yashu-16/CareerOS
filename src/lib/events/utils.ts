import type { EventType } from '@prisma/client'
import { stripHtml } from '@/lib/connectors/utils'

/** City aliases so "Bangalore" in a profile matches "Bengaluru" on an event. */
const CITY_ALIASES: Record<string, string[]> = {
  bengaluru: ['bangalore', 'bengaluru'],
  bangalore: ['bangalore', 'bengaluru'],
  gurugram: ['gurugram', 'gurgaon'],
  gurgaon: ['gurugram', 'gurgaon'],
  'new delhi': ['new delhi', 'delhi'],
  delhi: ['new delhi', 'delhi'],
  mumbai: ['mumbai', 'bombay'],
  chennai: ['chennai', 'madras'],
  kochi: ['kochi', 'cochin'],
  thiruvananthapuram: ['thiruvananthapuram', 'trivandrum'],
}

const CAREER_KEYWORDS =
  /\b(hackathon|career|job|intern|placement|workshop|webinar|conference|summit|network|hiring|recruit|tech|startup|founder|developer|engineer|data|ai|coding|case study|mba|fair|challenge|innovation|skill|training|professional|ideathon|pitchfest|competition|mentorship|portfolio|resume|interview|devops|product|design|analytics|finance|consulting)\b/i

const NON_CAREER_KEYWORDS =
  /\b(dinner|party|gala|wedding|dj night|freshers party|prom night|bollywood night|college fest|cultural fest|fashion show|treasure hunt only|sports fest|marathon run|food fest|music fest|garba|dandiya)\b/i

/** Drop social/party listings; keep career-adjacent events only. */
export function isCareerRelatedEvent(title: string, description: string): boolean {
  const text = `${title} ${stripHtml(description)}`.toLowerCase()
  if (NON_CAREER_KEYWORDS.test(text)) return false
  return CAREER_KEYWORDS.test(text)
}

function cityTokens(city: string): string[] {
  const key = city.toLowerCase().trim()
  if (!key) return []
  return CITY_ALIASES[key] || [key]
}

/** Online events are shown everywhere; offline events must match the user's city. */
export function matchesUserCity(
  userCity: string | null | undefined,
  event: { city?: string | null; location: string; isOnline: boolean }
): boolean {
  if (event.isOnline) return true
  if (!userCity?.trim()) return true

  const tokens = cityTokens(userCity)
  const haystack = `${event.city || ''} ${event.location}`.toLowerCase()
  return tokens.some((t) => haystack.includes(t))
}

/** Map a raw Unstop listing into our EventType enum (null = skip). */
export function mapUnstopEventType(raw: {
  title?: string
  type?: string
  public_url?: string
}): EventType | null {
  const title = (raw.title || '').toLowerCase()
  const urlPrefix = (raw.public_url || '').split('/')[0] || ''
  const type = (raw.type || '').toLowerCase()

  if (/job\s*fair|career\s*fair|placement\s*drive|recruitment\s*drive|campus\s*drive/i.test(title)) {
    return 'CAREER_FAIR'
  }
  if (type === 'hackathons' || urlPrefix === 'hackathons' || /\bhackathon\b|\bideathon\b/i.test(title)) {
    return 'HACKATHON'
  }
  if (type === 'workshops' || urlPrefix.includes('workshop') || urlPrefix.includes('webinar')) {
    return 'WORKSHOP'
  }
  if (
    /\bnetwork|\bmeetup|\bcommunity|\bfounder|\bbuilder|\bstartup meet|\bcareer connect|\bprofessional mixer/i.test(
      title
    )
  ) {
    return 'CAREER_SOCIAL'
  }
  if (type === 'conferences' || urlPrefix === 'conferences' || /\bconference|\bsummit|\bsymposium/i.test(title)) {
    return 'NETWORKING'
  }
  if (type === 'competitions' || urlPrefix === 'competitions') {
    if (/hackathon|coding|case study|innovation|challenge|pitch/i.test(title)) return 'HACKATHON'
    if (/fair|placement|recruit|hiring/i.test(title)) return 'CAREER_FAIR'
    return 'NETWORKING'
  }
  if (/\bhiring challenge|\bpredictions challenge|\bventure arena/i.test(title)) return 'NETWORKING'

  return null
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  HACKATHON: 'Hackathon',
  NETWORKING: 'Networking',
  CAREER_SOCIAL: 'Career social',
  CAREER_FAIR: 'Career fair',
  WORKSHOP: 'Workshop',
}
