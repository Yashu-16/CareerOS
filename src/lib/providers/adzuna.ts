import type { NormalizedJob } from '@/lib/jobs-api'
import type { JobType } from '@prisma/client'
import { clamp, inferJobType, inferLocationType, isLikelyIndia } from '@/lib/connectors/utils'
import { isJobPostedTooOld } from '@/lib/job-freshness'

const BASE = 'https://api.adzuna.com/v1/api/jobs/in/search'

const SEARCHES: Array<{ what: string; where?: string }> = [
  { what: 'software engineer', where: 'India' },
  { what: 'developer', where: 'Bengaluru' },
  { what: 'developer', where: 'Mumbai' },
  { what: 'developer', where: 'Hyderabad' },
  { what: 'developer', where: 'Pune' },
  { what: 'data scientist', where: 'India' },
  { what: 'product manager', where: 'India' },
  { what: 'internship', where: 'India' },
  { what: 'business analyst', where: 'India' },
  { what: 'devops', where: 'India' },
]

function mapContractType(t?: string): JobType {
  const x = (t || '').toLowerCase()
  if (x.includes('part')) return 'PARTTIME'
  if (x.includes('contract')) return 'CONTRACT'
  if (x.includes('intern')) return 'INTERNSHIP'
  return 'FULLTIME'
}

export function isAdzunaConfigured(): boolean {
  return Boolean(process.env.ADZUNA_APP_ID?.trim() && process.env.ADZUNA_APP_KEY?.trim())
}

/** Adzuna India — free tier at https://developer.adzuna.com */
export async function fetchAdzunaJobs(): Promise<NormalizedJob[]> {
  const appId = process.env.ADZUNA_APP_ID?.trim()
  const appKey = process.env.ADZUNA_APP_KEY?.trim()
  if (!appId || !appKey) return []

  const byId = new Map<string, NormalizedJob>()

  for (const { what, where } of SEARCHES) {
    for (let page = 1; page <= 2; page++) {
      const url = new URL(`${BASE}/${page}`)
      url.searchParams.set('app_id', appId)
      url.searchParams.set('app_key', appKey)
      url.searchParams.set('what', what)
      if (where) url.searchParams.set('where', where)
      url.searchParams.set('results_per_page', '50')
      url.searchParams.set('max_days_old', '14')
      url.searchParams.set('sort_by', 'date')

      try {
        const res = await fetch(url.toString(), { cache: 'no-store' })
        if (!res.ok) {
          console.warn(`[ADZUNA] ${what} page ${page}: HTTP ${res.status}`)
          break
        }
        const data = await res.json()
        const rows: any[] = Array.isArray(data?.results) ? data.results : []
        if (rows.length === 0) break

        for (const row of rows) {
          const location =
            row.location?.display_name ||
            [row.location?.area?.[2], row.location?.area?.[1]].filter(Boolean).join(', ') ||
            'India'
          if (!isLikelyIndia(location)) continue

          const postedAt = row.created ? new Date(row.created) : null
          if (!postedAt || isJobPostedTooOld(postedAt)) continue

          const externalId = `adzuna:${row.id}`
          byId.set(externalId, {
            externalId,
            title: row.title || 'Untitled role',
            company: row.company?.display_name || 'Unknown company',
            companyLogo: null,
            location,
            locationType: inferLocationType(undefined, location),
            jobType: mapContractType(row.contract_type),
            salaryMin: row.salary_min ? Math.round(row.salary_min) : null,
            salaryMax: row.salary_max ? Math.round(row.salary_max) : null,
            salaryCurrency: 'INR',
            description: clamp(row.description || ''),
            requirements: null,
            skills: [],
            applyUrl: row.redirect_url || row.adref || '#',
            source: 'adzuna',
            postedAt,
          })
        }
      } catch (err) {
        console.error(`[ADZUNA] ${what} page ${page}:`, err)
        break
      }
    }
  }

  return [...byId.values()]
}
