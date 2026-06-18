import { Pinecone } from '@pinecone-database/pinecone'

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY || 'placeholder' })

const INDEX_NAME = 'careeros-jobs-india'

// Prefer targeting by host (faster, recommended) when provided, else by name.
const index = process.env.PINECONE_INDEX_HOST
  ? pinecone.index(INDEX_NAME, process.env.PINECONE_INDEX_HOST)
  : pinecone.index(INDEX_NAME)

export async function upsertJobEmbedding(
  jobId: string,
  embedding: number[],
  metadata: Record<string, string | number | boolean | string[]>
) {
  await index.namespace('jobs').upsert([
    {
      id: jobId,
      values: embedding,
      metadata,
    },
  ])
}

export async function upsertResumeEmbedding(userId: string, embedding: number[]) {
  await index.namespace('resumes').upsert([
    {
      id: userId,
      values: embedding,
    },
  ])
}

export interface JobMatch {
  id: string
  score: number
  metadata?: Record<string, unknown>
}

export async function findMatchingJobs(
  resumeEmbedding: number[],
  topK: number = 50
): Promise<JobMatch[]> {
  const results = await index.namespace('jobs').query({
    vector: resumeEmbedding,
    topK,
    includeMetadata: true,
  })
  return results.matches
    .filter((m) => m.score !== undefined && m.score > 0.65)
    .map((m) => ({ id: m.id, score: m.score ?? 0, metadata: m.metadata }))
}
