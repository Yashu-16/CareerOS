import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { CopilotChat } from '@/components/copilot/CopilotChat'

export const dynamic = 'force-dynamic'

export default async function CopilotPage() {
  const sessionUser = await getCurrentUser()
  if (!sessionUser) redirect('/login')

  // Reuse a recent empty session if available, otherwise start a fresh one.
  let session = await prisma.chatSession.findFirst({
    where: { userId: sessionUser.id },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { messages: true } } },
  })

  if (!session || session._count.messages > 0) {
    session = {
      ...(await prisma.chatSession.create({
        data: { userId: sessionUser.id, title: 'New conversation' },
      })),
      _count: { messages: 0 },
    }
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
