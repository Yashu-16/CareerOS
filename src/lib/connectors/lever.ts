import type { NormalizedJob } from '@/lib/jobs-api'
import { clamp, inferJobType, inferLocationType, isLikelyIndia, stripHtml } from './utils'

const BASE_URL = 'https://api.lever.co/v0/postings'

/**
 * Fetch live postings directly from a company's public Lever job board.
 * Throws on network/HTTP failure so the caller can decide how to handle it.
 */
export async function fetchLeverJobs(slug: string, companyName: string): Promise<NormalizedJob[]> {
  const res = await fetch(`${BASE_URL}/${slug}?mode=json`, {
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`Lever "${slug}" returned ${res.status}`)

  const rawJobs: any[] = await res.json()
  if (!Array.isArray(rawJobs)) return []

  const jobs: NormalizedJob[] = []
  for (const j of rawJobs) {
    const location: string = j?.categories?.location || j?.categories?.allLocations?.[0] || ''
    if (!isLikelyIndia(location)) continue

    const description = clamp(j?.descriptionPlain || stripHtml(j?.description || ''))
    const requirements = Array.isArray(j?.lists) && j.lists.length
      ? clamp(
          j.lists
            .map((l: any) => `${l?.text || ''}\n${stripHtml(l?.content || '')}`.trim())
            .filter(Boolean)
            .join('\n\n'),
          3000
        )
      : null

    jobs.push({
      externalId: `lever:${slug}:${j.id}`,
      title: j?.text || 'Untitled role',
      company: companyName,
      companyLogo: null,
      location,
      locationType: inferLocationType(j?.workplaceType, location),
      jobType: inferJobType(j?.text, j?.categories?.commitment),
      salaryMin: null,
      salaryMax: null,
      salaryCurrency: 'INR',
      description,
      requirements,
      skills: [],
      applyUrl: j?.hostedUrl || j?.applyUrl || '#',
      source: 'lever',
      postedAt: j?.createdAt ? new Date(j.createdAt) : new Date(),
    })
  }
  return jobs
}
