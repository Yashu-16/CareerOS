import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { ApiErrors } from '@/lib/errors'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const job = await prisma.job.findUnique({ where: { id: params.id } })
  if (!job) return ApiErrors.notFound('Job')

  const [saved, application] = await Promise.all([
    prisma.savedJob.findUnique({
      where: { userId_jobId: { userId: user.id, jobId: job.id } },
    }),
    prisma.application.findUnique({
      where: { userId_jobId: { userId: user.id, jobId: job.id } },
    }),
  ])

  // Don't leak the raw embedding vector to the client.
  const { embedding, ...safeJob } = job
  return NextResponse.json({
    job: safeJob,
    isSaved: !!saved,
    application: application ? { id: application.id, status: application.status } : null,
  })
}
