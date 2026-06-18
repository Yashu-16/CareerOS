import { NextRequest, NextResponse } from 'next/server'
import type { JobType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { searchJobs, normalizeJob } from '@/lib/jobs-api'
import { ApiErrors } from '@/lib/errors'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const VALID_TYPES: JobType[] = ['FULLTIME', 'PARTTIME', 'INTERNSHIP', 'CONTRACT', 'FREELANCE']

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const ip = getClientIp(req)
  const allowed = await rateLimit(`jobs:${ip}`, 100, 60)
  if (!allowed) return ApiErrors.rateLimited()

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || 'software developer India'
  const location = searchParams.get('location') || ''
  const jobTypeParam = (searchParams.get('jobType') || '').toUpperCase()
  const jobType = VALID_TYPES.includes(jobTypeParam as JobType) ? (jobTypeParam as JobType) : undefined
  const datePosted = searchParams.get('datePosted') || 'month'
  const page = parseInt(searchParams.get('page') || '1', 10)
  const source = searchParams.get('source') || 'live'

  // Cached DB results.
  if (source === 'cached') {
    const jobs = await prisma.job.findMany({
      where: { isActive: true, ...(jobType ? { jobType } : {}) },
      orderBy: { postedAt: 'desc' },
      take: 20,
      skip: (page - 1) * 20,
    })
    return NextResponse.json({ jobs, source: 'cached' })
  }

  // Live search from JSearch API.
  try {
    const searchQuery = [query, location].filter(Boolean).join(' ')
    const rawJobs = await searchJobs({ query: searchQuery, jobType, datePosted, page })
    const jobs = rawJobs.map(normalizeJob)

    // Persist in the background; never block the response.
    void Promise.all(
      jobs.map((job) =>
        prisma.job
          .upsert({
            where: { externalId: job.externalId },
            update: { ...job, scrapedAt: new Date() },
            create: job,
          })
          .catch(() => {})
      )
    )

    return NextResponse.json({ jobs, source: 'live', total: jobs.length })
  } catch (error) {
    console.error('[JOBS] live search failed, falling back to cache:', error)
    const cached = await prisma.job.findMany({
      where: { isActive: true, ...(jobType ? { jobType } : {}) },
      orderBy: { scrapedAt: 'desc' },
      take: 20,
    })
    return NextResponse.json({
      jobs: cached,
      source: 'cached',
      warning: `Showing cached results — live search temporarily unavailable (as of ${new Date().toLocaleString('en-IN')})`,
    })
  }
}
