import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { ResumePanel } from '@/components/resume/ResumePanel'
import type { ATSReport } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ResumePage() {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) redirect('/login')
  const userId = sessionUser.id

  const [user, resume, latestReport] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { targetRole: true, skills: true } }),
    prisma.resume.findFirst({
      where: { userId, isActive: true },
      select: { id: true, filename: true },
    }),
    prisma.aTSReport.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
  ])

  const context = [user?.targetRole, ...(user?.skills || [])].filter(Boolean).join(', ')

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-h1 text-gray-900">Resume & ATS</h1>
        <p className="text-body-md text-gray-500 mt-1">
          Upload your resume and get an AI-powered ATS score with rewrite suggestions.
        </p>
      </div>

      <ResumePanel
        initialResume={resume}
        initialReport={latestReport as ATSReport | null}
        context={context}
      />
    </div>
  )
}
