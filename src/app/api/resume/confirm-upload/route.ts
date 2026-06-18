import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { ApiErrors, auditLog } from '@/lib/errors'

const schema = z.object({
  key: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string(),
  fileSize: z.number().int().positive(),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  try {
    const { key, filename, mimeType, fileSize } = schema.parse(await req.json())

    // Ensure the key belongs to this user's namespace (defence in depth).
    if (!key.startsWith(`resumes/${user.id}/`)) return ApiErrors.forbidden()

    // New active resume — deactivate previous ones.
    await prisma.resume.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    })

    const resume = await prisma.resume.create({
      data: { userId: user.id, s3Key: key, filename, mimeType, fileSize, isActive: true },
    })

    await auditLog({ userId: user.id, action: 'RESUME_UPLOAD', resource: 'resume', details: { resumeId: resume.id } })

    return NextResponse.json({ resumeId: resume.id })
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    console.error('[CONFIRM_UPLOAD]', error)
    return ApiErrors.database()
  }
}
