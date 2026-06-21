import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { ApiErrors, auditLog } from '@/lib/errors'
import { clamp } from '@/lib/sanitize'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: { job: true },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json({ applications })
}

const createSchema = z.object({
  jobId: z.string().min(1),
  status: z
    .enum(['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'])
    .default('APPLIED'),
  matchScore: z.number().min(0).max(1).optional(),
  notes: z.string().max(5000).optional(),
  tailoredResumeId: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  try {
    const body = createSchema.parse(await req.json())
    const job = await prisma.job.findUnique({ where: { id: body.jobId } })
    if (!job) return ApiErrors.notFound('Job')

    const tailoredResumeId = body.tailoredResumeId
      ? (
          await prisma.tailoredResume.findFirst({
            where: { id: body.tailoredResumeId, userId: user.id, jobId: body.jobId },
          })
        )?.id
      : undefined

    const application = await prisma.application.upsert({
      where: { userId_jobId: { userId: user.id, jobId: body.jobId } },
      update: {
        status: body.status,
        notes: body.notes ? clamp(body.notes, 5000) : undefined,
        tailoredResumeId: tailoredResumeId ?? undefined,
      },
      create: {
        userId: user.id,
        jobId: body.jobId,
        status: body.status,
        matchScore: body.matchScore,
        notes: body.notes ? clamp(body.notes, 5000) : undefined,
        tailoredResumeId,
      },
      include: { job: true },
    })

    await auditLog({ userId: user.id, action: 'APPLICATION_CREATE', resource: 'application', details: { jobId: body.jobId } })

    return NextResponse.json({ application })
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    console.error('[APPLICATIONS_POST]', error)
    return ApiErrors.database()
  }
}
