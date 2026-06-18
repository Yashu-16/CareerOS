import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'
import { findMatchingJobs } from '@/lib/pinecone'
import { ApiErrors } from '@/lib/errors'

/**
 * Returns AI-matched jobs for the current user based on their active
 * resume embedding (semantic match via Pinecone).
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) return ApiErrors.unauthorized()

  const resume = await prisma.resume.findFirst({
    where: { userId: user.id, isActive: true },
    select: { id: true, embedding: true },
  })

  if (!resume?.embedding?.length) {
    return NextResponse.json({ jobs: [], reason: 'NO_RESUME_EMBEDDING' })
  }

  try {
    const matches = await findMatchingJobs(resume.embedding, 50)
    const jobIds = matches.map((m) => m.id)
    if (!jobIds.length) return NextResponse.json({ jobs: [] })

    const jobs = await prisma.job.findMany({ where: { id: { in: jobIds }, isActive: true } })
    const scored = jobs
      .map((job) => {
        const { embedding, ...safe } = job
        return { ...safe, matchScore: matches.find((m) => m.id === job.id)?.score ?? 0 }
      })
      .sort((a, b) => b.matchScore - a.matchScore)

    return NextResponse.json({ jobs: scored })
  } catch (error) {
    console.error('[JOBS_MATCH]', error)
    return ApiErrors.externalDown()
  }
}
