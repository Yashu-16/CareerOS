import type { NormalizedJob } from '@/lib/jobs-api'
import { clamp, inferJobType, isLikelyIndia } from '@/lib/connectors/utils'
import { isJobPostedTooOld } from '@/lib/job-freshness'

/** Remotive public API — remote-first roles (includes India-eligible remote). */
export async function fetchRemotiveJobs(): Promise<NormalizedJob[]> {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=200', { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const rows: any[] = Array.isArray(data?.jobs) ? data.jobs : []

    const jobs = []
    for (const row of rows) {
      const location = row.candidate_required_location || row.job_type || 'Remote'
      const title = row.title || ''
      const desc = row.description || ''
      const haystack = `${location} ${title} ${desc}`.toLowerCase()
      const indiaEligible =
        isLikelyIndia(location) ||
        haystack.includes('india') ||
        haystack.includes('worldwide') ||
        haystack.includes('anywhere') ||
        location.toLowerCase().includes('remote')

      if (!indiaEligible) continue

      const postedAt = row.publication_date ? new Date(row.publication_date) : null
      if (!postedAt || isJobPostedTooOld(postedAt)) continue

      jobs.push({
        externalId: `remotive:${row.id}`,
        title,
        company: row.company_name || 'Unknown company',
        companyLogo: row.company_logo_url || null,
        location: location.includes('India') ? location : `${location} (Remote)`,
        locationType: 'REMOTE' as const,
        jobType: inferJobType(title, row.job_type),
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: 'USD',
        description: clamp(desc),
        requirements: null,
        skills: Array.isArray(row.tags) ? row.tags.slice(0, 15) : [],
        applyUrl: row.url || '#',
        source: 'remotive',
        postedAt,
      })
    }
    return jobs
  } catch (err) {
    console.error('[REMOTIVE]', err)
    return []
  }
}
