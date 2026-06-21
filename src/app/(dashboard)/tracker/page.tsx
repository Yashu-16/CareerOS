import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { KanbanBoard } from '@/components/tracker/KanbanBoard'
import type { ApplicationWithJob } from '@/types'

export const revalidate = 30

export default async function TrackerPage() {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) redirect('/login')

  const applications = await prisma.application.findMany({
    where: { userId: sessionUser.id },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: true,
          companyLogo: true,
          location: true,
          locationType: true,
          jobType: true,
          applyUrl: true,
          postedAt: true,
          source: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h1 text-gray-900">Application Tracker</h1>
        <p className="text-body-md text-gray-500 mt-1">
          Drag applications between stages to update their status.
        </p>
      </div>
      <KanbanBoard initialApplications={applications as ApplicationWithJob[]} />
    </div>
  )
}
