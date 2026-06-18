import type { JobType, LocationType } from '@prisma/client'

const NAMED_ENTITIES: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&rsquo;': '\u2019',
  '&lsquo;': '\u2018',
  '&ldquo;': '\u201C',
  '&rdquo;': '\u201D',
  '&mdash;': '\u2014',
  '&ndash;': '\u2013',
  '&hellip;': '\u2026',
  '&bull;': '\u2022',
}

/**
 * Decode HTML entities and strip tags from ATS-provided content (Greenhouse
 * returns entity-encoded HTML, Lever returns real HTML). Returns clean plain text.
 */
export function stripHtml(input: string): string {
  if (!input) return ''
  let s = input
  s = s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
  s = s.replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
  for (const [k, v] of Object.entries(NAMED_ENTITIES)) s = s.split(k).join(v)
  s = s.split('&amp;').join('&')
  s = s.replace(/<[^>]*>/g, ' ')
  return s.replace(/\s+/g, ' ').trim()
}

const INDIA_KEYWORDS = [
  'india',
  'bengaluru',
  'bangalore',
  'mumbai',
  'new delhi',
  'delhi',
  'gurugram',
  'gurgaon',
  'noida',
  'hyderabad',
  'pune',
  'chennai',
  'kolkata',
  'ahmedabad',
  'jaipur',
  'kochi',
  'cochin',
  'chandigarh',
  'indore',
  'coimbatore',
  'thiruvananthapuram',
  'trivandrum',
  'karnataka',
  'maharashtra',
  'telangana',
  'tamil nadu',
  'haryana',
  'uttar pradesh',
  'kerala',
  'gujarat',
  'west bengal',
]

/**
 * Keep only India-relevant listings (the platform is India-focused). Matches
 * Indian cities/states or an explicit "India" mention.
 */
export function isLikelyIndia(location: string): boolean {
  const l = (location || '').toLowerCase()
  if (!l) return false
  return INDIA_KEYWORDS.some((k) => l.includes(k))
}

/**
 * Infer our JobType enum from free-text signals (job title, ATS commitment field).
 */
export function inferJobType(...texts: Array<string | undefined>): JobType {
  const t = texts.filter(Boolean).join(' ').toLowerCase()
  if (/\b(intern|internship|trainee|apprentice)\b/.test(t)) return 'INTERNSHIP'
  if (/\bpart[\s-]?time\b/.test(t)) return 'PARTTIME'
  if (/\b(contract|contractor|fixed[\s-]?term|temporary)\b/.test(t)) return 'CONTRACT'
  if (/\bfreelance\b/.test(t)) return 'FREELANCE'
  return 'FULLTIME'
}

/**
 * Infer LocationType from an ATS workplace flag and/or the location string.
 */
export function inferLocationType(workplaceType?: string, location?: string): LocationType {
  const w = (workplaceType || '').toLowerCase()
  if (w.includes('remote')) return 'REMOTE'
  if (w.includes('hybrid')) return 'HYBRID'
  const l = (location || '').toLowerCase()
  if (l.includes('remote')) return 'REMOTE'
  if (l.includes('hybrid')) return 'HYBRID'
  return 'ONSITE'
}

/** Cap long descriptions to keep storage and downstream processing sane. */
export function clamp(text: string, max = 5000): string {
  return text.length > max ? text.slice(0, max) : text
}

/**
 * Run `fn` over `items` with bounded concurrency. Used by connectors that need
 * a per-item detail fetch (e.g. SmartRecruiters) without firing hundreds of
 * requests at once. Results preserve input order.
 */
export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(Math.max(concurrency, 1), items.length || 1) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}
