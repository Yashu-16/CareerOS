import type { NormalizedJob } from '@/lib/jobs-api'
import { clamp, inferJobType, inferLocationType, isLikelyIndia, stripHtml } from './utils'

const BASE_URL = 'https://api.ashbyhq.com/posting-api/job-board'
const FETCH_OPTS = { cache: 'no-store' as const }

/**
 * Fetch live postings directly from a company's public Ashby job board.
 * Throws on network/HTTP failure so the caller can decide how to handle it.
 */
export async function fetchAshbyJobs(slug: string, companyName: string): Promise<NormalizedJob[]> {
  const res = await fetch(`${BASE_URL}/${slug}?includeCompensation=true`, FETCH_OPTS)
  if (!res.ok) throw new Error(`Ashby "${slug}" returned ${res.status}`)

  const data = await res.json()
  const rawJobs: any[] = Array.isArray(data?.jobs) ? data.jobs : []

  const jobs: NormalizedJob[] = []
  for (const j of rawJobs) {
    if (j?.isListed === false) continue

    const location: string = j?.location || ''
    const country: string = j?.address?.postalAddress?.addressCountry || ''
    if (!isLikelyIndia(location) && !isLikelyIndia(country)) continue

    const description = clamp(j?.descriptionPlain || stripHtml(j?.descriptionHtml || ''))
    const postedAt = j?.publishedAt ? new Date(j.publishedAt) : new Date()

    jobs.push({
      externalId: `ashby:${slug}:${j.id}`,
      title: j?.title || 'Untitled role',
      company: companyName,
      companyLogo: null,
      location: location || country || 'India',
      locationType: j?.isRemote ? 'REMOTE' : inferLocationType(j?.workplaceType, location),
      jobType: inferJobType(j?.employmentType, j?.title),
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: 'INR',
      description,
      requirements: null,
      skills: [],
      applyUrl: j?.jobUrl || j?.applyUrl || '#',
      source: 'ashby',
      postedAt,
    })
  }
  return jobs
}
