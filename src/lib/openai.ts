import OpenAI from 'openai'

// Fallback key avoids a construction-time throw when env is unset (build time).
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'sk-placeholder' })

/**
 * Generate a 1536-dim embedding for semantic matching.
 * Input is truncated to keep within the model token budget.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const truncated = text.slice(0, 30000)
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: truncated,
  })
  return response.data[0].embedding
}
