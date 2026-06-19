import { NextRequest, NextResponse } from 'next/server'
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

// Queries that specifically surface non-full-time arrangements. The jobType
// biases JSearch's employment_types filter; normalizeJob then refines the final
// type from the title so these land under the Part-time / Freelance / Contract
// filters instead of defaulting to Full-time.
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

export const maxDuration = 300

/**
 * Upsert a normalized job and (best-effort) generate + index its embedding.
 * Embedding failures are non-fatal so jobs still sync when AI/Pinecone are off.
 */
async function persistJob(normalized: NormalizedJob): Promise<void> {
  if (!normalized.externalId) return

  const job = await prisma.job.upsert({
    where: { externalId: normalized.externalId },
    update: { ...normalized, scrapedAt: new Date() },
    create: normalized,
  })

  // Skip embedding work entirely when AI isn't configured — avoids a failing
  // network round-trip per job and keeps the sync fast.
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
    console.error(`[CRON] embedding failed for ${job.id}:`, embErr)
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let synced = 0
  let failed = 0
  let connectorJobs = 0

  // 1. Direct-from-company boards (Greenhouse/Lever). No API key required.
  try {
    const jobs = await fetchConnectorJobs()
    for (const normalized of jobs) {
      try {
        await persistJob(normalized)
        connectorJobs++
        synced++
      } catch (err) {
        console.error('[CRON] connector job persist failed:', err)
        failed++
      }
    }
  } catch (err) {
    console.error('[CRON] connector fetch failed:', err)
  }

  // 2. Broad aggregated search via JSearch (requires JSEARCH_API_KEY).
  for (const query of INDIA_JOB_QUERIES) {
    try {
      const rawJobs = await searchJobs({ query, numPages: 2 })
      for (const rawJob of rawJobs) {
        try {
          await persistJob(normalizeJob(rawJob))
          synced++
        } catch (err) {
          console.error('[CRON] jsearch job persist failed:', err)
          failed++
        }
      }
    } catch (err) {
      console.error(`[CRON] Failed query "${query}":`, err)
      failed++
    }
  }

  // 3. Targeted part-time / freelance / contract searches so those filters
  //    aren't empty. date_posted is widened to a month to maximise coverage.
  for (const { query, jobType } of FLEX_JOB_QUERIES) {
    try {
      const rawJobs = await searchJobs({ query, jobType, datePosted: 'month', numPages: 1 })
      for (const rawJob of rawJobs) {
        try {
          await persistJob(normalizeJob(rawJob))
          synced++
        } catch (err) {
          console.error('[CRON] flex job persist failed:', err)
          failed++
        }
      }
    } catch (err) {
      console.error(`[CRON] Failed flex query "${query}":`, err)
      failed++
    }
  }

  return NextResponse.json({
    synced,
    connectorJobs,
    failed,
    timestamp: new Date().toISOString(),
  })
}
