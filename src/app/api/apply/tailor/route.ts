import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { tailorResumeForJob, isDocxResume } from '@/lib/resume-tailor'
import { ApiErrors, errorResponse } from '@/lib/errors'
import { rateLimit } from '@/lib/rate-limit'

const schema = z.object({ jobId: z.string().min(1) })

function assertTailoredResumeModel() {
  if (!(prisma as { tailoredResume?: unknown }).tailoredResume) {
    throw new Error('PRISMA_STALE')
  }
}

/** Tailor the user's active resume for a specific job (keyword optimization, same layout). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const allowed = await rateLimit(`tailor:${user.id}`, 15, 3600)
  if (!allowed) return ApiErrors.rateLimited()

  try {
    assertTailoredResumeModel()
    const { jobId } = schema.parse(await req.json())
    const result = await tailorResumeForJob(user.id, jobId)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    const msg = (error as Error).message
    if (msg === 'JOB_NOT_FOUND') return ApiErrors.notFound('Job')
    if (msg === 'NO_RESUME') {
      return ApiErrors.validation([{ message: 'Upload a resume first', path: ['resume'] }])
    }
    if (msg === 'DOCX_REQUIRED') {
      return ApiErrors.validation([
        {
          message:
            'Smart Apply requires a DOCX resume. Upload a .docx file on the Resume page to keep your layout while tailoring.',
          path: ['resume'],
        },
      ])
    }
    if (msg === 'UNSUPPORTED_FORMAT') {
      return ApiErrors.validation([
        { message: 'Upload a DOCX resume to use Smart Apply', path: ['resume'] },
      ])
    }
    if (msg === 'PRISMA_STALE') {
      return errorResponse(
        'SCHEMA_OUT_OF_DATE',
        'Server needs a restart after the Smart Apply update. Stop npm run dev, run npx prisma generate, then start again.',
        503
      )
    }
    console.error('[APPLY_TAILOR]', error)
    return ApiErrors.aiUnavailable()
  }
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const jobId = req.nextUrl.searchParams.get('jobId')
  if (!jobId) return ApiErrors.validation([{ message: 'jobId required', path: ['jobId'] }])

  try {
    assertTailoredResumeModel()
    const [tailored, resume] = await Promise.all([
      prisma.tailoredResume.findUnique({
        where: { userId_jobId: { userId: user.id, jobId } },
      }),
      prisma.resume.findFirst({
        where: { userId: user.id, isActive: true },
        select: { filename: true, mimeType: true },
      }),
    ])

    const resumeInfo = resume
      ? { filename: resume.filename, isDocx: isDocxResume(resume) }
      : null

    if (!tailored) {
      return NextResponse.json({ tailored: null, resume: resumeInfo })
    }

    return NextResponse.json({
      tailored: {
        id: tailored.id,
        overallScore: tailored.overallScore,
        matchedKeywords: tailored.matchedKeywords,
        missingKeywords: tailored.missingKeywords,
        addedKeywords: tailored.addedKeywords,
        suggestions: tailored.suggestions,
        filename: tailored.filename,
        mimeType: tailored.mimeType,
        appliedEditsCount: tailored.addedKeywords.length > 0 ? 1 : 0,
        downloadPath: `/api/apply/tailored/${tailored.id}/download`,
      },
      resume: resumeInfo,
    })
  } catch (error) {
    if ((error as Error).message === 'PRISMA_STALE') {
      return errorResponse(
        'SCHEMA_OUT_OF_DATE',
        'Server needs a restart after the Smart Apply update. Stop npm run dev, run npx prisma generate, then start again.',
        503
      )
    }
    console.error('[APPLY_TAILOR_GET]', error)
    return ApiErrors.database()
  }
}
