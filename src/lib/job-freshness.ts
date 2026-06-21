import type { Prisma } from '@prisma/client'

/** No postedAt cutoff by default — show all live synced listings (sorted newest first). */
export const DEFAULT_JOB_DATE_FILTER = 'all'

export const AGGREGATOR_RESYNC_MS = 96 * 60 * 60 * 1000
export const CONNECTOR_RESYNC_MS = 72 * 60 * 60 * 1000
export const MAX_JOB_POSTED_AGE_MS = 30 * 24 * 60 * 60 * 1000

export const ATS_SOURCES = ['greenhouse', 'lever', 'ashby', 'smartrecruiters', 'workday'] as const
export const AGGREGATOR_SOURCES = [
  'indeed',
  'linkedin',
  'naukri',
  'internshala',
  'adzuna',
  'remotive',
  'ziprecruiter',
] as const

const DAY_MS = 24 * 60 * 60 * 1000

export function datePostedSince(key: string): Date | null {
  switch (key) {
    case 'today':
      return new Date(Date.now() - DAY_MS)
    case '3days':
      return new Date(Date.now() - 3 * DAY_MS)
    case 'week':
      return new Date(Date.now() - 7 * DAY_MS)
    case 'month':
      return new Date(Date.now() - 30 * DAY_MS)
    default:
      return null
  }
}

/**
 * List filter for the Jobs page.
 * Default: every active job from the latest sync (no postedAt cutoff).
 * With a date filter: match postedAt OR still-live ATS board jobs re-synced recently.
 */
export function freshJobWhere(datePosted = DEFAULT_JOB_DATE_FILTER): Prisma.JobWhereInput {
  const base: Prisma.JobWhereInput = {
    isActive: true,
    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    NOT: { externalId: { startsWith: 'seed-' } },
  }

  const since = datePostedSince(datePosted)
  if (!since) return base

  return {
    ...base,
    OR: [
      { postedAt: { gte: since }, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      {
        source: { in: [...ATS_SOURCES] },
        scrapedAt: { gte: new Date(Date.now() - CONNECTOR_RESYNC_MS) },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    ],
    NOT: { externalId: { startsWith: 'seed-' } },
  }
}

export function isJobPostedTooOld(postedAt: Date): boolean {
  return Date.now() - postedAt.getTime() > MAX_JOB_POSTED_AGE_MS
}
