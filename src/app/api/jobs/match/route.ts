import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { getTopMatchedJobs } from '@/lib/job-fit'
import { JOB_LIST_SELECT } from '@/lib/job-list-select'
import { ApiErrors } from '@/lib/errors'

/**
 * Returns matched jobs for the current user. Uses vector search when embeddings
 * exist, otherwise scores jobs from the parsed resume + profile.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const limit = Math.min(20, Math.max(1, parseInt(req.nextUrl.searchParams.get('limit') || '10', 10) || 10))

  const resume = await prisma.resume.findFirst({
    where: { userId: user.id, isActive: true },
    select: { id: true, embedding: true, parsedText: true },
  })

  if (!resume) {
    return NextResponse.json({ jobs: [], reason: 'NO_RESUME' })
  }

  if (resume.embedding?.length && process.env.PINECONE_API_KEY) {
    try {
      const { findMatchingJobs } = await import('@/lib/pinecone')
      const matches = await findMatchingJobs(resume.embedding, limit)
      const jobIds = matches.map((m) => m.id)
      if (jobIds.length) {
        const jobs = await prisma.job.findMany({
          where: { id: { in: jobIds }, isActive: true },
          select: JOB_LIST_SELECT,
        })
        const scored = jobs
          .map((job) => ({
            ...job,
            matchScore: matches.find((m) => m.id === job.id)?.score ?? 0,
          }))
          .sort((a, b) => b.matchScore - a.matchScore)
        return NextResponse.json(
          { jobs: scored, source: 'vector' },
          { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } }
        )
      }
    } catch (error) {
      console.error('[JOBS_MATCH] vector failed, using resume fit:', error)
    }
  }

  if (resume.parsedText) {
    const jobs = await getTopMatchedJobs(user.id, limit)
    return NextResponse.json(
      { jobs, source: 'resume_fit' },
      { headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' } }
    )
  }

  return NextResponse.json({ jobs: [], reason: 'NO_PARSED_RESUME' })
}
