import type { JobType, LocationType } from '@prisma/client'

const BASE_URL = 'https://jsearch.p.rapidapi.com'

export interface SearchJobsParams {
  query: string
  location?: string
  jobType?: string
  datePosted?: string
  page?: number
  numPages?: number
}

export interface NormalizedJob {
  externalId: string
  title: string
  company: string
  companyLogo: string | null
  location: string
  locationType: LocationType
  jobType: JobType
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string
  description: string
  requirements: string | null
  skills: string[]
  applyUrl: string
  source: string
  postedAt: Date
}

/**
 * Query the JSearch (RapidAPI) endpoint for real Indian job listings.
 * Throws if the upstream is unavailable so callers can fall back to cached data.
 */
export async function searchJobs(params: SearchJobsParams): Promise<any[]> {
  if (!process.env.JSEARCH_API_KEY) {
    throw new Error('JSEARCH_API_KEY not configured')
  }

  const url = new URL(`${BASE_URL}/search`)
  url.searchParams.set('query', params.query)
  url.searchParams.set('location', params.location || 'India')
  // Only constrain employment type when the user actually picked one; otherwise
  // JSearch returns every type. Our internal enum must be translated to the
  // values JSearch expects (INTERN / CONTRACTOR), or filtering silently returns nothing.
  const jsearchType = toJSearchEmploymentType(params.jobType)
  if (jsearchType) url.searchParams.set('employment_types', jsearchType)
  url.searchParams.set('date_posted', params.datePosted || 'week')
  url.searchParams.set('page', String(params.page || 1))
  url.searchParams.set('num_pages', String(params.numPages || 1))
  url.searchParams.set('country', 'in')
  url.searchParams.set('language', 'en')

  const response = await fetch(url.toString(), {
    headers: {
      'X-RapidAPI-Key': process.env.JSEARCH_API_KEY!,
      'X-RapidAPI-Host': process.env.JSEARCH_API_HOST || 'jsearch.p.rapidapi.com',
    },
    next: { revalidate: 3600 },
  })

  if (!response.ok) throw new Error(`JSearch API error: ${response.status}`)
  const data = await response.json()
  return data.data || []
}

/**
 * Translate our internal JobType enum to the employment_types value JSearch
 * understands. Returns undefined when no specific type is requested so the
 * search isn't needlessly narrowed.
 */
function toJSearchEmploymentType(jobType?: string): string | undefined {
  if (!jobType) return undefined
  const map: Record<string, string> = {
    FULLTIME: 'FULLTIME',
    PARTTIME: 'PARTTIME',
    INTERNSHIP: 'INTERN',
    CONTRACT: 'CONTRACTOR',
    FREELANCE: 'CONTRACTOR',
  }
  return map[jobType.toUpperCase()]
}

function mapJobType(type?: string): JobType {
  const map: Record<string, JobType> = {
    FULLTIME: 'FULLTIME',
    PARTTIME: 'PARTTIME',
    INTERN: 'INTERNSHIP',
    CONTRACTOR: 'CONTRACT',
  }
  return map[(type || '').toUpperCase()] || 'FULLTIME'
}

export function normalizeJob(raw: any): NormalizedJob {
  const location = `${raw.job_city || ''}, ${raw.job_state || ''}, India`
    .replace(/^, /, '')
    .replace(/, ,/g, ',')
    .replace(/, $/, '')

  const publisher = (raw.job_publisher || '').toLowerCase()
  let source = 'indeed'
  if (publisher.includes('linkedin')) source = 'linkedin'
  else if (publisher.includes('naukri')) source = 'naukri'
  else if (publisher.includes('internshala')) source = 'internshala'

  return {
    externalId: raw.job_id,
    title: raw.job_title || 'Untitled role',
    company: raw.employer_name || 'Unknown company',
    companyLogo: raw.employer_logo || null,
    location,
    locationType: raw.job_is_remote ? 'REMOTE' : 'ONSITE',
    jobType: mapJobType(raw.job_employment_type),
    salaryMin: raw.job_min_salary ?? null,
    salaryMax: raw.job_max_salary ?? null,
    salaryCurrency: raw.job_salary_currency || 'INR',
    description: raw.job_description || '',
    requirements: raw.job_highlights?.Qualifications?.join('\n') || null,
    skills: raw.job_required_skills || [],
    applyUrl: raw.job_apply_link || '#',
    source,
    postedAt: raw.job_posted_at_timestamp
      ? new Date(raw.job_posted_at_timestamp * 1000)
      : new Date(),
  }
}
