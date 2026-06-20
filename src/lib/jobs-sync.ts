import type { NormalizedJob } from '@/lib/jobs-api'
import { searchJobs, normalizeJob } from '@/lib/jobs-api'
import { fetchConnectorJobs } from '@/lib/connectors'
import { WORKDAY_COMPANIES } from '@/lib/connectors/companies'
import { fetchAdzunaJobs, fetchAllWorkdayJobs, fetchRemotiveJobs } from '@/lib/providers'
import { generateEmbedding } from '@/lib/openai'
import { upsertJobEmbedding } from '@/lib/pinecone'
import { prisma } from '@/lib/prisma'
import {
  AGGREGATOR_RESYNC_MS,
  AGGREGATOR_SOURCES,
  ATS_SOURCES,
  CONNECTOR_RESYNC_MS,
} from '@/lib/job-freshness'

/** Broad JSearch queries — fewer calls, more pages per call to avoid 429 rate limits. */
const JSEARCH_QUERIES = [
  'software engineer India',
  'developer Bengaluru',
  'developer Mumbai',
  'data scientist India',
  'product manager India',
  'internship India',
  'fresher graduate India',
  'remote developer India',
]

const FLEX_JOB_QUERIES: Array<{ query: string; jobType: string }> = [
  { query: 'part time India', jobType: 'PARTTIME' },
  { query: 'freelance developer India', jobType: 'FREELANCE' },
  { query: 'contract engineer India', jobType: 'CONTRACT' },
]

const JOB_TTL_MS = 30 * 24 * 60 * 60 * 1000

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function persistJob(normalized: NormalizedJob): Promise<void> {
  if (!normalized.externalId) return

  const scrapedAt = new Date()
  const expiresAt = new Date(scrapedAt.getTime() + JOB_TTL_MS)

  const job = await prisma.job.upsert({
    where: { externalId: normalized.externalId },
    update: { ...normalized, isActive: true, scrapedAt, expiresAt },
    create: { ...normalized, scrapedAt, expiresAt },
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

async function persistBatch(jobs: NormalizedJob[], seenBySource: Map<string, Set<string>>) {
  let count = 0
  for (const normalized of jobs) {
    try {
      await persistJob(normalized)
      if (!seenBySource.has(normalized.source)) seenBySource.set(normalized.source, new Set())
      seenBySource.get(normalized.source)!.add(normalized.externalId)
      count++
    } catch (err) {
      console.error('[JOBS_SYNC] persist failed:', err)
    }
  }
  return count
}

async function deactivateStaleJobs(seenBySource: Map<string, Set<string>>): Promise<void> {
  const now = Date.now()

  for (const source of ATS_SOURCES) {
    const seen = seenBySource.get(source)
    if (!seen?.size) continue
    await prisma.job.updateMany({
      where: {
        source,
        isActive: true,
        externalId: { notIn: [...seen] },
      },
      data: { isActive: false },
    })
  }

  await prisma.job.updateMany({
    where: {
      source: { in: [...AGGREGATOR_SOURCES] },
      isActive: true,
      scrapedAt: { lt: new Date(now - AGGREGATOR_RESYNC_MS) },
    },
    data: { isActive: false },
  })

  await prisma.job.updateMany({
    where: {
      source: { in: [...ATS_SOURCES] },
      isActive: true,
      scrapedAt: { lt: new Date(now - CONNECTOR_RESYNC_MS) },
    },
    data: { isActive: false },
  })

  await prisma.job.updateMany({
    where: { isActive: true, expiresAt: { lt: new Date() } },
    data: { isActive: false },
  })

  await prisma.job.updateMany({
    where: { externalId: { startsWith: 'seed-' }, isActive: true },
    data: { isActive: false },
  })
}

export async function syncAllJobs(): Promise<{ synced: number; connectorJobs: number; failed: number }> {
  let synced = 0
  let failed = 0
  let connectorJobs = 0
  const seenBySource = new Map<string, Set<string>>()

  try {
    const [connector, workday, remotive, adzuna] = await Promise.all([
      fetchConnectorJobs(),
      fetchAllWorkdayJobs(WORKDAY_COMPANIES),
      fetchRemotiveJobs(),
      fetchAdzunaJobs(),
    ])

    const allBoardJobs = [...connector, ...workday]
    connectorJobs = allBoardJobs.length
    synced += await persistBatch(allBoardJobs, seenBySource)
    synced += await persistBatch(remotive, seenBySource)
    synced += await persistBatch(adzuna, seenBySource)

    console.log(
      `[JOBS_SYNC] boards=${connector.length} workday=${workday.length} remotive=${remotive.length} adzuna=${adzuna.length}`
    )
  } catch (err) {
    console.error('[JOBS_SYNC] connector/provider fetch failed:', err)
    failed++
  }

  if (process.env.JSEARCH_API_KEY) {
    for (const query of JSEARCH_QUERIES) {
      try {
        await sleep(2000)
        const rawJobs = await searchJobs({ query, numPages: 3, datePosted: 'week' })
        for (const rawJob of rawJobs) {
          try {
            const normalized = normalizeJob(rawJob)
            if (!normalized) continue
            await persistJob(normalized)
            if (!seenBySource.has(normalized.source)) seenBySource.set(normalized.source, new Set())
            seenBySource.get(normalized.source)!.add(normalized.externalId)
            synced++
          } catch (err) {
            console.error('[JOBS_SYNC] jsearch persist failed:', err)
            failed++
          }
        }
      } catch (err) {
        console.error(`[JOBS_SYNC] JSearch "${query}":`, err)
        failed++
      }
    }

    for (const { query, jobType } of FLEX_JOB_QUERIES) {
      try {
        await sleep(2000)
        const rawJobs = await searchJobs({ query, jobType, datePosted: 'week', numPages: 2 })
        for (const rawJob of rawJobs) {
          try {
            const normalized = normalizeJob(rawJob)
            if (!normalized) continue
            await persistJob(normalized)
            if (!seenBySource.has(normalized.source)) seenBySource.set(normalized.source, new Set())
            seenBySource.get(normalized.source)!.add(normalized.externalId)
            synced++
          } catch (err) {
            failed++
          }
        }
      } catch (err) {
        console.error(`[JOBS_SYNC] flex "${query}":`, err)
        failed++
      }
    }
  } else {
    console.warn('[JOBS_SYNC] JSEARCH_API_KEY missing — skipping Indeed/LinkedIn/Naukri/ZipRecruiter via JSearch')
  }

  await deactivateStaleJobs(seenBySource)

  return { synced, connectorJobs, failed }
}
