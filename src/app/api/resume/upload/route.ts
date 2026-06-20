import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { buildResumeKey, uploadResume } from '@/lib/resume-storage'
import { parseResumeBuffer } from '@/lib/resume-parser'
import { syncUserProfileFromResume } from '@/lib/resume-profile'
import { ApiErrors, auditLog } from '@/lib/errors'

const ALLOWED = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const MAX_SIZE = 5 * 1024 * 1024

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Accept a resume via multipart form upload, store it, parse text, and sync
 * the user's profile so job fit scores reflect the latest resume.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    if (!file || !(file instanceof File)) {
      return ApiErrors.validation([{ message: 'file is required', path: ['file'] }])
    }

    if (!ALLOWED.includes(file.type)) return ApiErrors.invalidFileType()
    if (file.size > MAX_SIZE) return ApiErrors.fileTooLarge()

    const buffer = Buffer.from(await file.arrayBuffer())
    const key = buildResumeKey(user.id, file.name)
    const storage = await uploadResume(key, buffer, file.type)

    await prisma.resume.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    })

    let parsedText: string | null = null
    let profileSynced: string[] = []

    try {
      parsedText = await parseResumeBuffer(buffer, file.type)
      profileSynced = (await syncUserProfileFromResume(user.id, parsedText)).updated
    } catch (parseErr) {
      console.error('[RESUME_UPLOAD] parse/sync failed:', parseErr)
    }

    const resume = await prisma.resume.create({
      data: {
        userId: user.id,
        s3Key: key,
        filename: file.name,
        mimeType: file.type,
        fileSize: file.size,
        isActive: true,
        parsedText,
      },
    })

    await auditLog({
      userId: user.id,
      action: 'RESUME_UPLOAD',
      resource: 'resume',
      details: { resumeId: resume.id, profileSynced },
    })

    return NextResponse.json({
      resumeId: resume.id,
      filename: file.name,
      profileSynced,
      parsed: Boolean(parsedText),
      storage,
    })
  } catch (error) {
    console.error('[RESUME_UPLOAD]', error)
    const msg = (error as Error).message
    if (msg === 'S3_UPLOAD_FAILED') {
      return ApiErrors.externalDown()
    }
    const code = (error as { code?: string })?.code
    if (code === 'P2003' || code === 'P2025') {
      return ApiErrors.unauthorized()
    }
    return ApiErrors.database()
  }
}
