import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { getResumeBuffer } from '@/lib/resume-storage'
import { parseResumeBuffer } from '@/lib/resume-parser'
import { ApiErrors } from '@/lib/errors'

const schema = z.object({ resumeId: z.string().min(1) })

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  try {
    const { resumeId } = schema.parse(await req.json())

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: user.id },
    })
    if (!resume) return ApiErrors.notFound('Resume')

    if (resume.parsedText) {
      return NextResponse.json({ text: resume.parsedText, cached: true })
    }

    const buffer = await getResumeBuffer(resume.s3Key)
    const text = await parseResumeBuffer(buffer, resume.mimeType)

    await prisma.resume.update({ where: { id: resumeId }, data: { parsedText: text } })
    return NextResponse.json({ text, cached: false })
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    console.error('[RESUME_PARSE]', error)
    return ApiErrors.database()
  }
}
