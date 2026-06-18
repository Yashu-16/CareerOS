import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { ApiErrors } from '@/lib/errors'

const schema = z.object({ jobId: z.string().min(1) })

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()
  try {
    const { jobId } = schema.parse(await req.json())
    const job = await prisma.job.findUnique({ where: { id: jobId } })
    if (!job) return ApiErrors.notFound('Job')

    await prisma.savedJob.upsert({
      where: { userId_jobId: { userId: user.id, jobId } },
      update: {},
      create: { userId: user.id, jobId },
    })
    return NextResponse.json({ saved: true })
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    return ApiErrors.database()
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()
  try {
    const { jobId } = schema.parse(await req.json())
    await prisma.savedJob.deleteMany({ where: { userId: user.id, jobId } })
    return NextResponse.json({ saved: false })
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    return ApiErrors.database()
  }
}
