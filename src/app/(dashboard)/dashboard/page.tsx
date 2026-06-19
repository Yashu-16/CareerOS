import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { getTopMatchedJobs } from '@/lib/job-fit'
import { StatsRow } from '@/components/dashboard/StatsRow'
import { TopMatchedJobs } from '@/components/dashboard/TopMatchedJobs'
import { ATSScoreCard } from '@/components/resume/ATSScoreCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import type { JobWithMatch } from '@/types'

export const dynamic = 'force-dynamic'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default async function DashboardPage() {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) redirect('/login')
  const userId = sessionUser.id

  const [user, latestATS, applicationStats, recentApplications, resume] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.aTSReport.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.application.groupBy({ by: ['status'], where: { userId }, _count: true }),
    prisma.application.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.resume.findFirst({ where: { userId, isActive: true }, select: { id: true, embedding: true, parsedText: true } }),
  ])

  // Matched jobs: prefer vector search when embeddings exist, else resume-based fit.
  let matchedJobs: JobWithMatch[] = []
  if (resume?.embedding?.length) {
    try {
      const { findMatchingJobs } = await import('@/lib/pinecone')
      const matches = await findMatchingJobs(resume.embedding, 10)
      const jobIds = matches.map((m) => m.id)
      if (jobIds.length) {
        const jobs = await prisma.job.findMany({ where: { id: { in: jobIds } } })
        matchedJobs = jobs
          .map((job) => ({ ...job, matchScore: matches.find((m) => m.id === job.id)?.score || 0 }))
          .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
      }
    } catch (err) {
      console.error('[DASHBOARD] vector match failed, using resume fit:', err)
    }
  }
  if (!matchedJobs.length && resume?.parsedText) {
    matchedJobs = await getTopMatchedJobs(userId, 10)
  }

  const statsMap = Object.fromEntries(applicationStats.map((s) => [s.status, s._count]))
  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 text-gray-900">
          {greeting()}, {firstName} 👋
        </h1>
        <p className="text-body-md text-gray-500 mt-1">Here&apos;s your career dashboard.</p>
      </div>

      <StatsRow
        applied={statsMap['APPLIED'] || 0}
        interviews={statsMap['INTERVIEW'] || 0}
        offers={statsMap['OFFER'] || 0}
        atsScore={latestATS?.overallScore}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <TopMatchedJobs jobs={matchedJobs} />
        </div>
        <div className="lg:col-span-4">
          <ATSScoreCard report={latestATS} resumeId={resume?.id} />
        </div>
      </div>

      <ActivityFeed applications={recentApplications} />
    </div>
  )
}
