import type { NormalizedJob } from '@/lib/jobs-api'
import { clamp, inferJobType, inferLocationType, isLikelyIndia, stripHtml } from '@/lib/connectors/utils'
import type { WorkdayCompany } from '@/lib/connectors/companies'

const FETCH_OPTS = { cache: 'no-store' as const, headers: { 'Content-Type': 'application/json' } }

function parsePostedOn(text?: string): Date | null {
  if (!text) return null
  const lower = text.toLowerCase()
  const now = Date.now()
  const day = 24 * 60 * 60 * 1000
  if (lower.includes('today')) return new Date(now - day * 0.5)
  if (lower.includes('yesterday')) return new Date(now - day * 1.5)
  const m = lower.match(/(\d+)\s+day/)
  if (m) return new Date(now - parseInt(m[1], 10) * day)
  const w = lower.match(/(\d+)\s+week/)
  if (w) return new Date(now - parseInt(w[1], 10) * 7 * day)
  return new Date(now - 3 * day)
}

async function fetchWorkdayPage(
  company: WorkdayCompany,
  offset: number
): Promise<{ jobs: any[]; total: number }> {
  const url = `https://${company.host}/wday/cxs/${company.tenant}/${company.site}/jobs`
  const res = await fetch(url, {
    ...FETCH_OPTS,
    method: 'POST',
    body: JSON.stringify({
      appliedFacets: {},
      limit: 20,
      offset,
      searchText: '',
    }),
  })
  if (!res.ok) throw new Error(`Workday "${company.tenant}" returned ${res.status}`)
  const data = await res.json()
  return {
    jobs: Array.isArray(data?.jobPostings) ? data.jobPostings : [],
    total: typeof data?.total === 'number' ? data.total : 0,
  }
}

/** Public Workday CXS job boards (company career sites). */
export async function fetchWorkdayJobs(company: WorkdayCompany): Promise<NormalizedJob[]> {
  const results: NormalizedJob[] = []
  let offset = 0
  const limit = 20
  let total = Infinity

  while (offset < total && offset < 200) {
    const { jobs, total: t } = await fetchWorkdayPage(company, offset)
    total = t
    if (jobs.length === 0) break

    for (const j of jobs) {
      const location = j.locationsText || j.location || ''
      if (!isLikelyIndia(location)) continue

      const title = j.title || 'Untitled role'
      const externalPath = j.externalPath || j.bulletFields?.[0] || String(j.title)
      const externalId = `workday:${company.tenant}:${externalPath}`.replace(/\s+/g, '_').slice(0, 180)
      const postedAt = parsePostedOn(j.postedOn) || new Date()

      results.push({
        externalId,
        title,
        company: company.name,
        companyLogo: null,
        location: location || 'India',
        locationType: inferLocationType(undefined, location),
        jobType: inferJobType(title, j.timeType),
        salaryMin: null,
        salaryMax: null,
        salaryCurrency: 'INR',
        description: clamp(stripHtml(j.description || title)),
        requirements: null,
        skills: [],
        applyUrl: `https://${company.host}${externalPath.startsWith('/') ? externalPath : `/${externalPath}`}`,
        source: 'workday',
        postedAt,
      })
    }

    offset += limit
  }

  return results
}

export async function fetchAllWorkdayJobs(companies: WorkdayCompany[]): Promise<NormalizedJob[]> {
  const byId = new Map<string, NormalizedJob>()
  await Promise.all(
    companies.map(async (c) => {
      try {
        for (const job of await fetchWorkdayJobs(c)) {
          byId.set(job.externalId, job)
        }
      } catch (err) {
        console.error(`[WORKDAY][${c.tenant}]`, (err as Error).message)
      }
    })
  )
  return [...byId.values()]
}
