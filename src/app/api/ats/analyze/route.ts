import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { analyzeResumeATS } from '@/lib/anthropic'
import { generateEmbedding } from '@/lib/openai'
import { upsertResumeEmbedding } from '@/lib/pinecone'
import { generateDownloadUrl } from '@/lib/s3'
import { parseResumeBuffer } from '@/lib/resume-parser'
import { ApiErrors, auditLog } from '@/lib/errors'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const schema = z.object({
  resumeId: z.string().min(1),
  jobDescription: z.string().max(20000).optional(),
})

export async function POST(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const ip = getClientIp(req)
  const allowed = await rateLimit(`ats:${user.id}`, 10, 3600)
  if (!allowed) return ApiErrors.rateLimited()

  try {
    const { resumeId, jobDescription } = schema.parse(await req.json())

    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId: user.id },
    })
    if (!resume) return ApiErrors.notFound('Resume')

    // Get resume text (cached if available).
    let resumeText = resume.parsedText
    if (!resumeText) {
      const downloadUrl = await generateDownloadUrl(resume.s3Key)
      const fileRes = await fetch(downloadUrl)
      if (!fileRes.ok) return ApiErrors.externalDown()
      const buffer = Buffer.from(await fileRes.arrayBuffer())
      resumeText = await parseResumeBuffer(buffer, resume.mimeType)
      await prisma.resume.update({ where: { id: resumeId }, data: { parsedText: resumeText } })
    }

    let analysis
    try {
      analysis = await analyzeResumeATS(resumeText, jobDescription)
    } catch (err) {
      console.error('[ATS_ANALYZE] AI failed:', err)
      return ApiErrors.aiUnavailable()
    }

    const report = await prisma.aTSReport.create({
      data: {
        userId: user.id,
        resumeId,
        overallScore: analysis.overallScore,
        experienceScore: analysis.experienceScore,
        skillsScore: analysis.skillsScore,
        educationScore: analysis.educationScore,
        summaryScore: analysis.summaryScore,
        matchedKeywords: analysis.matchedKeywords,
        missingKeywords: analysis.missingKeywords,
        suggestions: analysis.suggestions,
        rawAnalysis: analysis.summary,
      },
    })

    // Best-effort embedding for semantic matching — don't fail the request on error.
    try {
      const embedding = await generateEmbedding(resumeText)
      await prisma.resume.update({ where: { id: resumeId }, data: { embedding } })
      await upsertResumeEmbedding(user.id, embedding)
    } catch (err) {
      console.error('[ATS_ANALYZE] embedding failed:', err)
    }

    await auditLog({ userId: user.id, action: 'ATS_ANALYZE', resource: 'ats_report', details: { reportId: report.id }, ip })

    return NextResponse.json(report)
  } catch (error) {
    if (error instanceof z.ZodError) return ApiErrors.validation(error.errors)
    console.error('[ATS_ANALYZE]', error)
    return ApiErrors.database()
  }
}
