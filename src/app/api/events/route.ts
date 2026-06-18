import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { ApiErrors } from '@/lib/errors'

/**
 * "Hiring drives" are derived from REAL job data: companies that are actively
 * hiring right now, grouped with their open-role counts. No fabricated events.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const grouped = await prisma.job.groupBy({
    by: ['company'],
    where: { isActive: true },
    _count: { _all: true },
    _max: { postedAt: true },
    orderBy: { _count: { company: 'desc' } },
    take: 24,
  })

  // Attach a representative location + apply link from a real listing.
  const drives = await Promise.all(
    grouped.map(async (g) => {
      const sample = await prisma.job.findFirst({
        where: { company: g.company, isActive: true },
        orderBy: { postedAt: 'desc' },
        select: { id: true, company: true, companyLogo: true, location: true, applyUrl: true, title: true },
      })
      return {
        company: g.company,
        openRoles: g._count._all,
        latestPostedAt: g._max.postedAt,
        sampleRole: sample?.title ?? null,
        companyLogo: sample?.companyLogo ?? null,
        location: sample?.location ?? 'India',
        applyUrl: sample?.applyUrl ?? '#',
        jobId: sample?.id ?? null,
      }
    })
  )

  return NextResponse.json({ drives })
}
