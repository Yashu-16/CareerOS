import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { StatsRow } from '@/components/dashboard/StatsRow'
import { TopMatchedJobsLoader } from '@/components/dashboard/TopMatchedJobsLoader'
import { ATSScoreCard } from '@/components/resume/ATSScoreCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'

export const revalidate = 30

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
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),
    prisma.aTSReport.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        overallScore: true,
        experienceScore: true,
        skillsScore: true,
        educationScore: true,
        summaryScore: true,
        matchedKeywords: true,
        missingKeywords: true,
        suggestions: true,
        createdAt: true,
      },
    }),
    prisma.application.groupBy({ by: ['status'], where: { userId }, _count: true }),
    prisma.application.findMany({
      where: { userId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            applyUrl: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    prisma.resume.findFirst({
      where: { userId, isActive: true },
      select: { id: true },
    }),
  ])

  const statsMap = Object.fromEntries(applicationStats.map((s) => [s.status, s._count]))
  const firstName = user?.name?.split(' ')[0] || sessionUser.name?.split(' ')[0] || 'there'

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
          <TopMatchedJobsLoader />
        </div>
        <div className="lg:col-span-4">
          <ATSScoreCard report={latestATS as Parameters<typeof ATSScoreCard>[0]['report']} resumeId={resume?.id} />
        </div>
      </div>

      <ActivityFeed applications={recentApplications as Parameters<typeof ActivityFeed>[0]['applications']} />
    </div>
  )
}
