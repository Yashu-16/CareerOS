import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { getResumeBuffer } from '@/lib/resume-storage'
import { parseResumeBuffer } from '@/lib/resume-parser'
import { syncUserProfileFromResume } from '@/lib/resume-profile'
import { ApiErrors } from '@/lib/errors'

/**
 * Re-read the active resume and refresh the user's profile fields.
 * Useful from the Profile page without re-uploading the file.
 */
export async function POST() {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const resume = await prisma.resume.findFirst({
    where: { userId: user.id, isActive: true },
  })
  if (!resume) return ApiErrors.notFound('Resume')

  try {
    let text = resume.parsedText
    if (!text) {
      const buffer = await getResumeBuffer(resume.s3Key)
      text = await parseResumeBuffer(buffer, resume.mimeType)
      await prisma.resume.update({ where: { id: resume.id }, data: { parsedText: text } })
    }

    const { updated } = await syncUserProfileFromResume(user.id, text)

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        college: true,
        degree: true,
        graduationYear: true,
        city: true,
        targetRole: true,
        targetIndustry: true,
        experienceLevel: true,
        skills: true,
        bio: true,
        linkedinUrl: true,
        githubUrl: true,
        portfolioUrl: true,
      },
    })

    return NextResponse.json({ updated, profile })
  } catch (error) {
    console.error('[PROFILE_SYNC_FROM_RESUME]', error)
    return ApiErrors.externalDown()
  }
}
