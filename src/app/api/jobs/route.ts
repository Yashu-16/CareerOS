import { NextRequest, NextResponse } from 'next/server'
import type { JobType, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { ApiErrors } from '@/lib/errors'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { computeFitScore, buildFitProfile } from '@/lib/job-fit'
import { FIT_SCORE_POOL, JOB_FIT_SCORE_SELECT, JOB_LIST_SELECT, type JobListRow } from '@/lib/job-list-select'
import { DEFAULT_JOB_DATE_FILTER, freshJobWhere } from '@/lib/job-freshness'

const VALID_TYPES: JobType[] = ['FULLTIME', 'PARTTIME', 'INTERNSHIP', 'CONTRACT', 'FREELANCE']
const PAGE_SIZE = 20

const COMPANY_SOURCES = ['greenhouse', 'lever', 'ashby', 'smartrecruiters', 'workday']

function sourceClause(key: string): Prisma.StringFilter | string | undefined {
  if (!key) return undefined
  if (key === 'company') return { in: COMPANY_SOURCES }
  return key
}

function scoreJobs(jobs: JobListRow[], fitProfile: ReturnType<typeof buildFitProfile>, hasResume: boolean) {
  const scored = jobs.map((job) => ({
    ...job,
    matchScore: computeFitScore(job, fitProfile),
  }))
  if (!hasResume) return scored
  return scored.sort(
    (a, b) =>
      (b.matchScore ?? 0) - (a.matchScore ?? 0) ||
      new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  )
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const ip = getClientIp(req)
  const allowed = await rateLimit(`jobs:${ip}`, 100, 60)
  if (!allowed) return ApiErrors.rateLimited()

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const location = (searchParams.get('location') || '').trim()
  const jobTypeParam = (searchParams.get('jobType') || '').toUpperCase()
  const jobType = VALID_TYPES.includes(jobTypeParam as JobType) ? (jobTypeParam as JobType) : undefined
  const datePosted = searchParams.get('datePosted') || DEFAULT_JOB_DATE_FILTER
  const sourceParam = (searchParams.get('source') || '').toLowerCase()
  const page = Math.min(50, Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1))
  const includeFacets = searchParams.get('facets') !== '0' && page === 1

  const baseWhere: Prisma.JobWhereInput = {
    ...freshJobWhere(datePosted),
  }
  if (location) baseWhere.location = { contains: location, mode: 'insensitive' }

  if (q) {
    const terms = q.split(/\s+/).filter((t) => t.length > 1)
    if (terms.length) {
      baseWhere.AND = terms.map((term) => ({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { company: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      }))
    }
  }

  const src = sourceClause(sourceParam)

  const typeFacetWhere: Prisma.JobWhereInput = { ...baseWhere }
  if (src) typeFacetWhere.source = src

  const sourceFacetWhere: Prisma.JobWhereInput = { ...baseWhere }
  if (jobType) sourceFacetWhere.jobType = jobType

  const where: Prisma.JobWhereInput = { ...baseWhere }
  if (jobType) where.jobType = jobType
  if (src) where.source = src

  try {
    const profilePromise = prisma.user.findUnique({
      where: { id: user.id },
      select: { skills: true, targetRole: true, experienceLevel: true, city: true },
    })
    const resumePromise = prisma.resume.findFirst({
      where: { userId: user.id, isActive: true },
      select: { parsedText: true },
    })
    const totalPromise = includeFacets || page === 1 ? prisma.job.count({ where }) : Promise.resolve(0)

    const facetPromises = includeFacets
      ? [
          prisma.job.groupBy({
            by: ['jobType'],
            where: typeFacetWhere,
            _count: { _all: true },
          }),
          prisma.job.groupBy({
            by: ['source'],
            where: sourceFacetWhere,
            _count: { _all: true },
          }),
        ]
      : [Promise.resolve([]), Promise.resolve([])]

    const [total, profile, resume, typeGroups, sourceGroups] = await Promise.all([
      totalPromise,
      profilePromise,
      resumePromise,
      ...facetPromises,
    ])

    const typeFacets = includeFacets
      ? (typeGroups as { jobType: string; _count: { _all: number } }[]).reduce<Record<string, number>>(
          (acc, g) => {
            acc[g.jobType] = g._count._all
            return acc
          },
          {}
        )
      : undefined

    const sourceFacets = includeFacets
      ? (sourceGroups as { source: string; _count: { _all: number } }[]).reduce<Record<string, number>>(
          (acc, g) => {
            acc[g.source] = g._count._all
            return acc
          },
          {}
        )
      : undefined

    const fitProfile = buildFitProfile(profile ?? {}, resume)
    const hasResume = Boolean(resume?.parsedText)
    const skip = (page - 1) * PAGE_SIZE

    let jobs: Array<JobListRow & { matchScore: number }>

    if (hasResume) {
      // Score a bounded pool, then paginate — avoids loading embeddings or full table scans.
      const pool = await prisma.job.findMany({
        where,
        select: JOB_FIT_SCORE_SELECT,
        orderBy: { postedAt: 'desc' },
        take: FIT_SCORE_POOL,
      })
      jobs = scoreJobs(pool, fitProfile, true)
        .slice(skip, skip + PAGE_SIZE)
        .map((job) => {
          const { description: _omit, ...rest } = job as typeof job & { description?: string }
          return rest
        })
    } else {
      const pageJobs = await prisma.job.findMany({
        where,
        select: JOB_LIST_SELECT,
        orderBy: { postedAt: 'desc' },
        skip,
        take: PAGE_SIZE,
      })
      jobs = scoreJobs(pageJobs, fitProfile, false)
    }

    return NextResponse.json(
      {
        jobs,
        source: 'database',
        total: total || undefined,
        page,
        pageSize: PAGE_SIZE,
        hasMore: total ? page * PAGE_SIZE < total : jobs.length === PAGE_SIZE,
        typeFacets,
        sourceFacets,
        catalogUpdatedAt: (
          await prisma.job.aggregate({
            where: { isActive: true },
            _max: { scrapedAt: true },
          })
        )._max.scrapedAt?.toISOString(),
        nextScheduledSyncIst: '12:00 PM IST daily',
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=10, stale-while-revalidate=20',
        },
      }
    )
  } catch (error) {
    console.error('[JOBS] search failed:', error)
    return ApiErrors.database()
  }
}
