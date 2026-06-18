import { NextRequest, NextResponse } from 'next/server'
import { searchJobs, normalizeJob } from '@/lib/jobs-api'
import { generateEmbedding } from '@/lib/openai'
import { upsertJobEmbedding } from '@/lib/pinecone'
import { prisma } from '@/lib/prisma'

const INDIA_JOB_QUERIES = [
  'software engineer India',
  'React developer India',
  'Node.js developer India',
  'Python developer India',
  'Data scientist India',
  'Product manager India',
  'DevOps engineer India',
  'Java developer India',
  'iOS developer India',
  'Android developer India',
  'Machine learning engineer India',
  'Full stack developer India',
  'Business analyst India',
  'Financial analyst India',
  'marketing manager India',
  'UI UX designer India',
  'internship software India',
  'internship data science India',
  'fresher software engineer India',
  'fresher MBA India',
]

export const maxDuration = 300

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let synced = 0
  let failed = 0

  for (const query of INDIA_JOB_QUERIES) {
    try {
      const rawJobs = await searchJobs({ query, numPages: 2 })

      for (const rawJob of rawJobs) {
        const normalized = normalizeJob(rawJob)
        if (!normalized.externalId) continue

        const job = await prisma.job.upsert({
          where: { externalId: normalized.externalId },
          update: { ...normalized, scrapedAt: new Date() },
          create: normalized,
        })

        try {
          const embeddingText = `${job.title} ${job.company} ${job.location} ${job.description.slice(0, 2000)} ${job.skills.join(' ')}`
          const embedding = await generateEmbedding(embeddingText)

          await upsertJobEmbedding(job.id, embedding, {
            job_id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            skills: job.skills,
            jobType: job.jobType,
            locationType: job.locationType,
            source: job.source,
            postedAt: job.postedAt.toISOString(),
          })

          await prisma.job.update({ where: { id: job.id }, data: { embedding } })
        } catch (embErr) {
          console.error(`[CRON] embedding failed for ${job.id}:`, embErr)
        }

        synced++
      }
    } catch (err) {
      console.error(`[CRON] Failed query "${query}":`, err)
      failed++
    }
  }

  return NextResponse.json({ synced, failed, timestamp: new Date().toISOString() })
}
