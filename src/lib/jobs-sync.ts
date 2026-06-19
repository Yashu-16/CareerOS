import type { NormalizedJob } from '@/lib/jobs-api'
import { searchJobs, normalizeJob } from '@/lib/jobs-api'
import { fetchConnectorJobs } from '@/lib/connectors'
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

const FLEX_JOB_QUERIES: Array<{ query: string; jobType: string }> = [
  { query: 'part time jobs India', jobType: 'PARTTIME' },
  { query: 'part time data entry India', jobType: 'PARTTIME' },
  { query: 'part time content writer India', jobType: 'PARTTIME' },
  { query: 'part time customer support India', jobType: 'PARTTIME' },
  { query: 'freelance developer India', jobType: 'FREELANCE' },
  { query: 'freelance graphic designer India', jobType: 'FREELANCE' },
  { query: 'freelance content writer India', jobType: 'FREELANCE' },
  { query: 'contract software engineer India', jobType: 'CONTRACT' },
  { query: 'contract data analyst India', jobType: 'CONTRACT' },
]

async function persistJob(normalized: NormalizedJob): Promise<void> {
  if (!normalized.externalId) return

  const job = await prisma.job.upsert({
    where: { externalId: normalized.externalId },
    update: { ...normalized, isActive: true, scrapedAt: new Date() },
    create: normalized,
  })

  if (!process.env.OPENAI_API_KEY) return

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
    console.error(`[JOBS_SYNC] embedding failed for ${job.id}:`, embErr)
  }
}

export async function syncAllJobs(): Promise<{ synced: number; connectorJobs: number; failed: number }> {
  let synced = 0
  let failed = 0
  let connectorJobs = 0

  try {
    const jobs = await fetchConnectorJobs()
    for (const normalized of jobs) {
      try {
        await persistJob(normalized)
        connectorJobs++
        synced++
      } catch (err) {
        console.error('[JOBS_SYNC] connector job persist failed:', err)
        failed++
      }
    }
  } catch (err) {
    console.error('[JOBS_SYNC] connector fetch failed:', err)
  }

  for (const query of INDIA_JOB_QUERIES) {
    try {
      const rawJobs = await searchJobs({ query, numPages: 2 })
      for (const rawJob of rawJobs) {
        try {
          await persistJob(normalizeJob(rawJob))
          synced++
        } catch (err) {
          console.error('[JOBS_SYNC] jsearch job persist failed:', err)
          failed++
        }
      }
    } catch (err) {
      console.error(`[JOBS_SYNC] Failed query "${query}":`, err)
      failed++
    }
  }

  for (const { query, jobType } of FLEX_JOB_QUERIES) {
    try {
      const rawJobs = await searchJobs({ query, jobType, datePosted: 'month', numPages: 1 })
      for (const rawJob of rawJobs) {
        try {
          await persistJob(normalizeJob(rawJob))
          synced++
        } catch (err) {
          console.error('[JOBS_SYNC] flex job persist failed:', err)
          failed++
        }
      }
    } catch (err) {
      console.error(`[JOBS_SYNC] Failed flex query "${query}":`, err)
      failed++
    }
  }

  return { synced, connectorJobs, failed }
}
