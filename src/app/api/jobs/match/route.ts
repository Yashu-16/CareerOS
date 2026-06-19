import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { getTopMatchedJobs } from '@/lib/job-fit'
import { ApiErrors } from '@/lib/errors'

/**
 * Returns matched jobs for the current user. Uses vector search when embeddings
 * exist, otherwise scores jobs from the parsed resume + profile.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const resume = await prisma.resume.findFirst({
    where: { userId: user.id, isActive: true },
    select: { id: true, embedding: true, parsedText: true },
  })

  if (!resume) {
    return NextResponse.json({ jobs: [], reason: 'NO_RESUME' })
  }

  if (resume.embedding?.length) {
    try {
      const { findMatchingJobs } = await import('@/lib/pinecone')
      const matches = await findMatchingJobs(resume.embedding, 50)
      const jobIds = matches.map((m) => m.id)
      if (jobIds.length) {
        const jobs = await prisma.job.findMany({ where: { id: { in: jobIds }, isActive: true } })
        const scored = jobs
          .map((job) => {
            const { embedding, ...safe } = job
            return { ...safe, matchScore: matches.find((m) => m.id === job.id)?.score ?? 0 }
          })
          .sort((a, b) => b.matchScore - a.matchScore)
        return NextResponse.json({ jobs: scored, source: 'vector' })
      }
    } catch (error) {
      console.error('[JOBS_MATCH] vector failed, using resume fit:', error)
    }
  }

  if (resume.parsedText) {
    const jobs = await getTopMatchedJobs(user.id, 50)
    return NextResponse.json({ jobs, source: 'resume_fit' })
  }

  return NextResponse.json({ jobs: [], reason: 'NO_PARSED_RESUME' })
}
