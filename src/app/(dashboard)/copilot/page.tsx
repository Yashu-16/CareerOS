import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { CopilotChat } from '@/components/copilot/CopilotChat'

export const revalidate = 0

export default async function CopilotPage() {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) redirect('/login')

  let session = await prisma.chatSession.findFirst({
    where: { userId: sessionUser.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  })

  if (!session) {
    session = await prisma.chatSession.create({
      data: { userId: sessionUser.id, title: 'New conversation' },
      select: { id: true },
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-h1 text-gray-900">AI Copilot</h1>
        <p className="text-body-md text-gray-500 mt-1">
          Career guidance tailored to your profile and the Indian job market.
        </p>
      </div>
      <CopilotChat sessionId={session.id} />
    </div>
  )
}
