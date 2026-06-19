import { NextRequest, NextResponse } from 'next/server'
import type { JobType, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { ApiErrors } from '@/lib/errors'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { computeFitScore, buildFitProfile } from '@/lib/job-fit'

const VALID_TYPES: JobType[] = ['FULLTIME', 'PARTTIME', 'INTERNSHIP', 'CONTRACT', 'FREELANCE']
const PAGE_SIZE = 20

// Sources that come straight from a company's own ATS career page (direct apply,
// no aggregator middleman). Grouped under the "Company career pages" source filter.
const COMPANY_SOURCES = ['greenhouse', 'lever', 'ashby', 'smartrecruiters']

/** Build a Prisma `source` filter from the source filter key. */
function sourceClause(key: string): Prisma.StringFilter | string | undefined {
  if (!key) return undefined
  if (key === 'company') return { in: COMPANY_SOURCES }
  return key
}

/** Translate a "date posted" filter key into an earliest-postedAt cutoff. */
function dateSince(key: string): Date | null {
  const day = 24 * 60 * 60 * 1000
  switch (key) {
    case 'today':
      return new Date(Date.now() - day)
    case '3days':
      return new Date(Date.now() - 3 * day)
    case 'week':
      return new Date(Date.now() - 7 * day)
    case 'month':
      return new Date(Date.now() - 30 * day)
    default:
      return null
  }
}

/**
 * Search the local jobs catalog. The catalog is kept fresh by the sync-jobs
 * cron (direct-from-company boards + JSearch), so reads are fast, free, and
 * cover every source. This avoids burning the JSearch quota on each page load.
 */
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
  const datePosted = searchParams.get('datePosted') || ''
  const sourceParam = (searchParams.get('source') || '').toLowerCase()
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)

  // baseWhere holds the filters shared by every query (search/location/date).
  // The two facetable dimensions — job type and source — are layered on top so
  // each facet count can exclude its own dimension (letting the user freely
  // switch within that dimension) while still respecting the others.
  const baseWhere: Prisma.JobWhereInput = { isActive: true }
  if (location) baseWhere.location = { contains: location, mode: 'insensitive' }

  const since = dateSince(datePosted)
  if (since) baseWhere.postedAt = { gte: since }

  if (q) {
    // Every search term must match somewhere (title/company/description).
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

  // typeFacets respect source (but not jobType); sourceFacets respect jobType
  // (but not source); the main query respects both.
  const typeFacetWhere: Prisma.JobWhereInput = { ...baseWhere }
  if (src) typeFacetWhere.source = src

  const sourceFacetWhere: Prisma.JobWhereInput = { ...baseWhere }
  if (jobType) sourceFacetWhere.jobType = jobType

  const where: Prisma.JobWhereInput = { ...baseWhere }
  if (jobType) where.jobType = jobType
  if (src) where.source = src

  try {
    const [total, profile, resume, typeGroups, sourceGroups] = await Promise.all([
      prisma.job.count({ where }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { skills: true, targetRole: true, experienceLevel: true, city: true },
      }),
      prisma.resume.findFirst({
        where: { userId: user.id, isActive: true },
        select: { parsedText: true },
      }),
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
    ])

    const typeFacets = typeGroups.reduce<Record<string, number>>((acc, g) => {
      acc[g.jobType] = g._count._all
      return acc
    }, {})

    const sourceFacets = sourceGroups.reduce<Record<string, number>>((acc, g) => {
      acc[g.source] = g._count._all
      return acc
    }, {})

    const fitProfile = buildFitProfile(profile ?? {}, resume)

    // Score every matching job, then sort by fit when the user has a parsed resume
    // so the most relevant roles surface first (not just the newest aggregators).
    const allMatching = await prisma.job.findMany({ where, orderBy: { postedAt: 'desc' } })
    const scoredAll = allMatching.map((job) => {
      const { embedding, ...safe } = job
      return { ...safe, matchScore: computeFitScore(job, fitProfile) }
    })

    const sorted =
      resume?.parsedText
        ? scoredAll.sort(
            (a, b) =>
              (b.matchScore ?? 0) - (a.matchScore ?? 0) ||
              new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
          )
        : scoredAll

    const scored = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return NextResponse.json({
      jobs: scored,
      source: 'database',
      total,
      page,
      pageSize: PAGE_SIZE,
      hasMore: page * PAGE_SIZE < total,
      typeFacets,
      sourceFacets,
    })
  } catch (error) {
    console.error('[JOBS] search failed:', error)
    return ApiErrors.database()
  }
}
