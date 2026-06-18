import type { NormalizedJob } from '@/lib/jobs-api'
import { clamp, inferJobType, isLikelyIndia, mapPool, stripHtml } from './utils'

const BASE_URL = 'https://api.smartrecruiters.com/v1/companies'
// Bound the per-company detail fetches so a huge board can't explode request count.
const MAX_PER_COMPANY = 60

interface SrPosting {
  id: string
  name?: string
  releasedDate?: string
  location?: {
    city?: string
    region?: string
    country?: string
    remote?: boolean
    hybrid?: boolean
    fullLocation?: string
  }
  typeOfEmployment?: { label?: string }
}

function postingLocation(p: SrPosting): string {
  return (
    p.location?.fullLocation ||
    [p.location?.city, p.location?.region, p.location?.country?.toUpperCase()].filter(Boolean).join(', ') ||
    'India'
  )
}

async function fetchPostingDetail(slug: string, id: string): Promise<any | null> {
  try {
    const res = await fetch(`${BASE_URL}/${slug}/postings/${id}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

/**
 * Fetch live postings directly from a company's public SmartRecruiters board.
 * The list endpoint omits descriptions, so we fetch each India posting's detail
 * with bounded concurrency. Throws on the initial list failure.
 */
export async function fetchSmartRecruitersJobs(slug: string, companyName: string): Promise<NormalizedJob[]> {
  const res = await fetch(`${BASE_URL}/${slug}/postings?limit=100`, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`SmartRecruiters "${slug}" returned ${res.status}`)

  const data = await res.json()
  const content: SrPosting[] = Array.isArray(data?.content) ? data.content : []

  const indian = content
    .filter((p) => {
      const country = (p.location?.country || '').toLowerCase()
      return country === 'in' || isLikelyIndia(postingLocation(p))
    })
    .slice(0, MAX_PER_COMPANY)

  const details = await mapPool(indian, 6, (p) => fetchPostingDetail(slug, p.id))

  return indian.map((p, i) => {
    const sections = details[i]?.jobAd?.sections || {}
    const descParts = [sections?.companyDescription?.text, sections?.jobDescription?.text]
      .filter(Boolean)
      .map((t: string) => stripHtml(t))
    const description = clamp(descParts.join('\n\n') || p.name || '')
    const requirements = sections?.qualifications?.text
      ? clamp(stripHtml(sections.qualifications.text), 3000)
      : null

    const locationType = p.location?.remote ? 'REMOTE' : p.location?.hybrid ? 'HYBRID' : 'ONSITE'

    return {
      externalId: `smartrecruiters:${slug}:${p.id}`,
      title: p.name || 'Untitled role',
      company: companyName,
      companyLogo: null,
      location: postingLocation(p),
      locationType,
      jobType: inferJobType(p.typeOfEmployment?.label, p.name),
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: 'INR',
      description,
      requirements,
      skills: [],
      applyUrl: `https://jobs.smartrecruiters.com/${slug}/${p.id}`,
      source: 'smartrecruiters',
      postedAt: p.releasedDate ? new Date(p.releasedDate) : new Date(),
    }
  })
}
