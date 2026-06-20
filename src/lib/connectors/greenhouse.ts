import type { NormalizedJob } from '@/lib/jobs-api'
import { clamp, inferJobType, inferLocationType, isLikelyIndia, stripHtml } from './utils'

const BASE_URL = 'https://boards-api.greenhouse.io/v1/boards'
const FETCH_OPTS = { cache: 'no-store' as const }

/**
 * Fetch live postings directly from a company's public Greenhouse job board.
 * `?content=true` includes the full (entity-encoded HTML) job description.
 * Throws on network/HTTP failure so the caller can decide how to handle it.
 */
export async function fetchGreenhouseJobs(slug: string, companyName: string): Promise<NormalizedJob[]> {
  const res = await fetch(`${BASE_URL}/${slug}/jobs?content=true`, FETCH_OPTS)
  if (!res.ok) throw new Error(`Greenhouse "${slug}" returned ${res.status}`)

  const data = await res.json()
  const rawJobs: any[] = Array.isArray(data?.jobs) ? data.jobs : []

  const jobs: NormalizedJob[] = []
  for (const j of rawJobs) {
    const location: string = j?.location?.name || ''
    if (!isLikelyIndia(location)) continue

    const description = clamp(stripHtml(j?.content || ''))
    const postedAt = j?.first_published
      ? new Date(j.first_published)
      : j?.updated_at
        ? new Date(j.updated_at)
        : new Date()

    jobs.push({
      externalId: `greenhouse:${slug}:${j.id}`,
      title: j?.title || 'Untitled role',
      company: companyName,
      companyLogo: null,
      location,
      locationType: inferLocationType(undefined, location),
      jobType: inferJobType(j?.title),
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: 'INR',
      description,
      requirements: null,
      skills: [],
      applyUrl: j?.absolute_url || '#',
      source: 'greenhouse',
      postedAt,
    })
  }
  return jobs
}
