import type { NormalizedJob } from '@/lib/jobs-api'
import {
  ASHBY_COMPANIES,
  GREENHOUSE_COMPANIES,
  LEVER_COMPANIES,
  SMARTRECRUITERS_COMPANIES,
} from './companies'
import { fetchGreenhouseJobs } from './greenhouse'
import { fetchLeverJobs } from './lever'
import { fetchAshbyJobs } from './ashby'
import { fetchSmartRecruitersJobs } from './smartrecruiters'

export {
  ASHBY_COMPANIES,
  GREENHOUSE_COMPANIES,
  LEVER_COMPANIES,
  SMARTRECRUITERS_COMPANIES,
} from './companies'
export { fetchGreenhouseJobs } from './greenhouse'
export { fetchLeverJobs } from './lever'
export { fetchAshbyJobs } from './ashby'
export { fetchSmartRecruitersJobs } from './smartrecruiters'

/**
 * Fetch India-relevant jobs straight from every configured company career
 * board (Greenhouse, Lever, Ashby, SmartRecruiters). Each board is fetched
 * independently; one failing board never blocks the others. Results are
 * de-duplicated by externalId.
 */
export async function fetchConnectorJobs(): Promise<NormalizedJob[]> {
  const guard = (label: string, p: Promise<NormalizedJob[]>) =>
    p.catch((err) => {
      console.error(`[CONNECTOR][${label}]`, err.message)
      return [] as NormalizedJob[]
    })

  const tasks: Array<Promise<NormalizedJob[]>> = [
    ...GREENHOUSE_COMPANIES.map((c) => guard(`greenhouse:${c.slug}`, fetchGreenhouseJobs(c.slug, c.name))),
    ...LEVER_COMPANIES.map((c) => guard(`lever:${c.slug}`, fetchLeverJobs(c.slug, c.name))),
    ...ASHBY_COMPANIES.map((c) => guard(`ashby:${c.slug}`, fetchAshbyJobs(c.slug, c.name))),
    ...SMARTRECRUITERS_COMPANIES.map((c) =>
      guard(`smartrecruiters:${c.slug}`, fetchSmartRecruitersJobs(c.slug, c.name))
    ),
  ]

  const results = await Promise.all(tasks)
  const byId = new Map<string, NormalizedJob>()
  for (const batch of results) {
    for (const job of batch) {
      if (job.externalId) byId.set(job.externalId, job)
    }
  }
  return [...byId.values()]
}
