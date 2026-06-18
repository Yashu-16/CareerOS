import { NextRequest, NextResponse } from 'next/server'
import type { JobType, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { ApiErrors } from '@/lib/errors'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const VALID_TYPES: JobType[] = ['FULLTIME', 'PARTTIME', 'INTERNSHIP', 'CONTRACT', 'FREELANCE']
const PAGE_SIZE = 20

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
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)

  const where: Prisma.JobWhereInput = { isActive: true }
  if (jobType) where.jobType = jobType
  if (location) where.location = { contains: location, mode: 'insensitive' }

  const since = dateSince(datePosted)
  if (since) where.postedAt = { gte: since }

  if (q) {
    // Every search term must match somewhere (title/company/description).
    const terms = q.split(/\s+/).filter((t) => t.length > 1)
    if (terms.length) {
      where.AND = terms.map((term) => ({
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { company: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
        ],
      }))
    }
  }

  try {
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { postedAt: 'desc' },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.job.count({ where }),
    ])

    return NextResponse.json({
      jobs,
      source: 'database',
      total,
      page,
      pageSize: PAGE_SIZE,
      hasMore: page * PAGE_SIZE < total,
    })
  } catch (error) {
    console.error('[JOBS] search failed:', error)
    return ApiErrors.database()
  }
}
