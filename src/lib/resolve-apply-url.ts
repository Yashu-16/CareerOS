import { prisma } from '@/lib/prisma'

export interface ParsedApplyUrl {
  source: 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters' | 'workday' | 'unknown'
  externalId: string | null
  slug: string | null
  remoteId: string | null
  normalizedUrl: string
}

/** Normalize ATS apply URLs so job-boards.greenhouse.io matches boards.greenhouse.io. */
export function normalizeApplyUrl(raw: string): string {
  try {
    const u = new URL(raw.split('#')[0].split('?')[0])
    u.hostname = u.hostname.replace(/^job-boards\./, 'boards.')
    u.pathname = u.pathname.replace(/\/+$/, '')
    return `${u.protocol}//${u.hostname}${u.pathname}`.toLowerCase()
  } catch {
    return raw.toLowerCase().split('?')[0].split('#')[0]
  }
}

export function isAtsApplyUrl(raw: string): boolean {
  try {
    const h = new URL(raw).hostname.toLowerCase()
    return (
      h.includes('greenhouse.io') ||
      h.includes('lever.co') ||
      h.includes('ashbyhq.com') ||
      h.includes('workday') ||
      h.includes('smartrecruiters.com')
    )
  } catch {
    return false
  }
}

export function parseApplyPageUrl(raw: string): ParsedApplyUrl | null {
  try {
    const u = new URL(raw.split('#')[0])
    const normalizedUrl = normalizeApplyUrl(raw)

    if (u.hostname.includes('greenhouse.io')) {
      const m = u.pathname.match(/\/([^/]+)\/jobs\/(\d+)/i)
      if (m) {
        return {
          source: 'greenhouse',
          slug: m[1],
          remoteId: m[2],
          externalId: `greenhouse:${m[1]}:${m[2]}`,
          normalizedUrl,
        }
      }
    }

    if (u.hostname.includes('lever.co')) {
      const m = u.pathname.match(/^\/([^/]+)\/([a-f0-9-]{8,})/i)
      if (m) {
        return {
          source: 'lever',
          slug: m[1],
          remoteId: m[2],
          externalId: `lever:${m[1]}:${m[2]}`,
          normalizedUrl,
        }
      }
    }

    if (u.hostname.includes('ashbyhq.com')) {
      const m = u.pathname.match(/^\/([^/]+)\/([a-f0-9-]{8,})/i)
      if (m) {
        return {
          source: 'ashby',
          slug: m[1],
          remoteId: m[2],
          externalId: `ashby:${m[1]}:${m[2]}`,
          normalizedUrl,
        }
      }
    }

    if (u.hostname.includes('smartrecruiters.com')) {
      const m = u.pathname.match(/^\/([^/]+)\/(\d+)/i)
      if (m) {
        return {
          source: 'smartrecruiters',
          slug: m[1],
          remoteId: m[2],
          externalId: `smartrecruiters:${m[1]}:${m[2]}`,
          normalizedUrl,
        }
      }
    }

    if (isAtsApplyUrl(raw)) {
      return {
        source: 'unknown',
        externalId: null,
        slug: null,
        remoteId: null,
        normalizedUrl,
      }
    }

    return null
  } catch {
    return null
  }
}

export interface ResolvedApplyJob {
  id: string
  title: string
  company: string
  applyUrl: string
  tailoredResumeId: string | null
  tailoredResumeFilename: string | null
}

export async function resolveJobFromApplyUrl(
  url: string,
  userId?: string
): Promise<ResolvedApplyJob | null> {
  const parsed = parseApplyPageUrl(url)
  if (!parsed) return null

  let job =
    parsed.externalId != null
      ? await prisma.job.findUnique({
          where: { externalId: parsed.externalId },
          select: {
            id: true,
            title: true,
            company: true,
            applyUrl: true,
          },
        })
      : null

  if (!job && parsed.remoteId) {
    const candidates = await prisma.job.findMany({
      where: {
        isActive: true,
        applyUrl: { contains: parsed.remoteId },
      },
      select: {
        id: true,
        title: true,
        company: true,
        applyUrl: true,
      },
      take: 10,
    })
    job =
      candidates.find((c) => normalizeApplyUrl(c.applyUrl) === parsed.normalizedUrl) ||
      candidates[0] ||
      null
  }

  if (!job) return null

  let tailoredResumeId: string | null = null
  let tailoredResumeFilename: string | null = null

  if (userId) {
    const tailored = await prisma.tailoredResume.findUnique({
      where: { userId_jobId: { userId, jobId: job.id } },
      select: { id: true, filename: true },
    })
    tailoredResumeId = tailored?.id || null
    tailoredResumeFilename = tailored?.filename || null
  }

  return {
    id: job.id,
    title: job.title,
    company: job.company,
    applyUrl: job.applyUrl,
    tailoredResumeId,
    tailoredResumeFilename,
  }
}

/** Best-effort title/company from a browser tab title on ATS pages. */
export function parseTabTitle(tabTitle: string): { title: string | null; company: string | null } {
  const t = tabTitle.trim()
  if (!t) return { title: null, company: null }

  const atMatch = t.match(/^(.+?)\s+at\s+(.+?)(?:\s+\||\s+-|$)/i)
  if (atMatch) {
    return { title: atMatch[1].trim(), company: atMatch[2].trim() }
  }

  const forMatch = t.match(/(?:job application for|apply for)\s+(.+?)\s+at\s+(.+?)(?:\s+\||\s+-|$)/i)
  if (forMatch) {
    return { title: forMatch[1].trim(), company: forMatch[2].trim() }
  }

  const dash = t.split(/\s[-|]\s/)
  if (dash.length >= 2) {
    return { title: dash[0].trim(), company: dash[dash.length - 1].trim() }
  }

  return { title: t, company: null }
}
