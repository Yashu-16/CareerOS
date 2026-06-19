import Anthropic from '@anthropic-ai/sdk'
import type { ExperienceLevel } from '@prisma/client'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-placeholder',
})

const PRIMARY_MODEL = 'claude-sonnet-4-6'
const FALLBACK_MODEL = 'claude-haiku-4-5-20251001'

export interface ATSAnalysis {
  overallScore: number
  experienceScore: number
  skillsScore: number
  educationScore: number
  summaryScore: number
  matchedKeywords: string[]
  missingKeywords: string[]
  suggestions: Array<{
    section: 'Experience' | 'Skills' | 'Education' | 'Summary'
    original: string
    suggested: string
    reason: string
  }>
  summary: string
}

export interface AIExtractedProfile {
  name?: string | null
  city?: string | null
  college?: string | null
  degree?: string | null
  graduationYear?: number | null
  targetRole?: string | null
  targetIndustry?: string | null
  experienceLevel?: ExperienceLevel | null
  skills?: string[]
  bio?: string | null
  linkedinUrl?: string | null
  githubUrl?: string | null
  portfolioUrl?: string | null
}

/**
 * Robustly extract a JSON object from a model response that may include
 * code fences or surrounding prose.
 */
function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in model response')
  return JSON.parse(candidate.slice(start, end + 1)) as T
}

const ATS_SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) analyzer for the Indian job market.
Analyze resumes and return ONLY valid JSON with this exact structure:
{
  "overallScore": number (0-100),
  "experienceScore": number (0-100),
  "skillsScore": number (0-100),
  "educationScore": number (0-100),
  "summaryScore": number (0-100),
  "matchedKeywords": string[],
  "missingKeywords": string[],
  "suggestions": [
    {
      "section": "Experience" | "Skills" | "Education" | "Summary",
      "original": "original text",
      "suggested": "improved text",
      "reason": "why this is better"
    }
  ],
  "summary": "2-3 sentence overall assessment"
}
Score based on: keyword density, quantified achievements, ATS-friendly formatting, relevant skills for the Indian tech market.`

const PROFILE_EXTRACT_PROMPT = `You extract structured career profile data from resumes for the Indian job market.
Return ONLY valid JSON with this exact structure (use null for unknown fields):
{
  "name": string | null,
  "city": string | null,
  "college": string | null,
  "degree": string | null,
  "graduationYear": number | null,
  "targetRole": string | null,
  "targetIndustry": string | null,
  "experienceLevel": "FRESHER" | "ZERO_TO_TWO" | "TWO_TO_FIVE" | "FIVE_PLUS" | null,
  "skills": string[],
  "bio": string | null,
  "linkedinUrl": string | null,
  "githubUrl": string | null,
  "portfolioUrl": string | null
}
Infer targetRole from the most recent job title or stated objective. skills should list concrete tools/technologies (max 30). bio is a 1-2 sentence professional summary (max 300 chars).`

export async function extractProfileFromResume(resumeText: string): Promise<AIExtractedProfile> {
  const runWith = async (model: string) => {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1200,
      system: PROFILE_EXTRACT_PROMPT,
      messages: [{ role: 'user', content: `Resume:\n${resumeText}` }],
    })
    const block = response.content[0]
    const text = block && block.type === 'text' ? block.text : ''
    return extractJson<AIExtractedProfile>(text)
  }

  try {
    return await runWith(FALLBACK_MODEL)
  } catch (err) {
    console.error('[ANTHROPIC] Profile extract failed on fallback:', err)
    return await runWith(PRIMARY_MODEL)
  }
}

export async function analyzeResumeATS(
  resumeText: string,
  jobDescription?: string
): Promise<ATSAnalysis> {
  const userContent = jobDescription
    ? `Resume:\n${resumeText}\n\nTarget Job Description:\n${jobDescription}`
    : `Resume:\n${resumeText}`

  const runWith = async (model: string) => {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1500,
      system: ATS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    const block = response.content[0]
    const text = block && block.type === 'text' ? block.text : ''
    return extractJson<ATSAnalysis>(text)
  }

  try {
    return await runWith(PRIMARY_MODEL)
  } catch (err) {
    console.error('[ANTHROPIC] Primary model failed, trying fallback:', err)
    return await runWith(FALLBACK_MODEL)
  }
}

export async function rewriteBulletPoint(original: string, context: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: FALLBACK_MODEL,
    max_tokens: 500,
    system: `You are an expert resume writer for the Indian job market.
Rewrite resume bullet points to be ATS-optimized, quantified, and impactful.
Start with a strong action verb. Include metrics where possible.
Return ONLY the rewritten bullet point, nothing else.`,
    messages: [
      {
        role: 'user',
        content: `Context (role/skills): ${context}\n\nOriginal bullet: ${original}`,
      },
    ],
  })
  const block = response.content[0]
  return block && block.type === 'text' ? block.text.trim() : original
}

export async function* streamCopilotResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  userProfile: { targetRole?: string | null; skills?: string[]; experienceLevel?: string | null }
) {
  const systemPrompt = `You are CareerOS AI Copilot — a dedicated career advisor for Indian students and professionals.
You specialize in: resume optimization, job search strategy, interview preparation, skill gap analysis, and career planning for the Indian job market (IT, finance, consulting, startups).
User profile: Target Role: ${userProfile.targetRole || 'Not specified'}, Skills: ${userProfile.skills?.join(', ') || 'Not specified'}, Level: ${userProfile.experienceLevel || 'Not specified'}.
Be specific, actionable, and knowledgeable about the Indian hiring landscape (Infosys, TCS, startups, product companies, FAANG India offices).
If asked anything unrelated to careers, jobs, or professional development, politely redirect: "I'm specialized in career guidance. Let me help you with something career-related instead."
Keep responses concise and formatted with clear sections when helpful.`

  const stream = anthropic.messages.stream({
    model: PRIMARY_MODEL,
    max_tokens: 1000,
    system: systemPrompt,
    messages,
  })

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      yield chunk.delta.text
    }
  }
}
