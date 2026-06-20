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
 * code fences, trailing commas, or truncated output.
 */
function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  let candidate = (fenced ? fenced[1] : text).trim()
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in model response')
  candidate = candidate.slice(start, end + 1)

  try {
    return JSON.parse(candidate) as T
  } catch {
    // Attempt to repair truncated JSON (common when max_tokens cuts off mid-array).
    const repaired = candidate
      .replace(/,\s*]/g, ']')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*$/g, '')
    const lastBrace = repaired.lastIndexOf('}')
    if (lastBrace > 0) {
      try {
        return JSON.parse(repaired.slice(0, lastBrace + 1)) as T
      } catch {
        /* try closing open arrays */
      }
    }
    const withClose = repaired.replace(/,\s*"[^"]*"?\s*:\s*"[^"]*$/, '') + ']}'
    try {
      return JSON.parse(withClose + '}') as T
    } catch {
      throw new Error('Invalid JSON in model response')
    }
  }
}

function clampScore(n: unknown): number {
  const v = typeof n === 'number' ? n : parseInt(String(n), 10)
  if (Number.isNaN(v)) return 50
  return Math.max(0, Math.min(100, Math.round(v)))
}

function normalizeAnalysis(raw: Partial<ATSAnalysis>): ATSAnalysis {
  return {
    overallScore: clampScore(raw.overallScore),
    experienceScore: clampScore(raw.experienceScore),
    skillsScore: clampScore(raw.skillsScore),
    educationScore: clampScore(raw.educationScore),
    summaryScore: clampScore(raw.summaryScore),
    matchedKeywords: Array.isArray(raw.matchedKeywords) ? raw.matchedKeywords.slice(0, 30) : [],
    missingKeywords: Array.isArray(raw.missingKeywords) ? raw.missingKeywords.slice(0, 20) : [],
    suggestions: Array.isArray(raw.suggestions)
      ? raw.suggestions.slice(0, 8).map((s) => ({
          section: (['Experience', 'Skills', 'Education', 'Summary'].includes(s?.section)
            ? s.section
            : 'Experience') as ATSAnalysis['suggestions'][0]['section'],
          original: String(s?.original || '').slice(0, 500),
          suggested: String(s?.suggested || '').slice(0, 500),
          reason: String(s?.reason || '').slice(0, 200),
        }))
      : [],
    summary: String(raw.summary || 'Resume analyzed for job fit.').slice(0, 500),
  }
}

function fallbackAnalysis(resumeText: string, jobDescription?: string): ATSAnalysis {
  const resumeLower = resumeText.toLowerCase()
  const jobLower = (jobDescription || '').toLowerCase()
  const jobWords = [...new Set(jobLower.match(/\b[a-z][a-z0-9+#.]{2,}\b/gi) || [])].slice(0, 40)
  const matched = jobWords.filter((w) => resumeLower.includes(w.toLowerCase())).slice(0, 15)
  const missing = jobWords.filter((w) => !resumeLower.includes(w.toLowerCase())).slice(0, 10)
  const score = jobWords.length ? Math.round((matched.length / jobWords.length) * 100) : 55
  return {
    overallScore: Math.min(85, Math.max(35, score)),
    experienceScore: score,
    skillsScore: score,
    educationScore: 60,
    summaryScore: 55,
    matchedKeywords: matched,
    missingKeywords: missing,
    suggestions: [],
    summary: 'Keyword-based fit estimate (AI parse unavailable). Upload DOCX for best tailoring.',
  }
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
Score based on: keyword density, quantified achievements, ATS-friendly formatting, relevant skills for the Indian tech market.
Rules: Return at most 6 suggestions. Keep each original/suggested string under 180 characters. Use valid JSON only — escape double quotes inside strings. No markdown.`

const TAILOR_ATS_PROMPT = `${ATS_SYSTEM_PROMPT}

TAILORING MODE (when a job description is provided):
- The resume file is edited IN PLACE. Layout, fonts, columns, colors, and spacing must NOT change.
- Each "original" must be an EXACT verbatim phrase copied from the resume (character-accurate).
- Each "suggested" must keep the same sentence structure as "original" — only weave in 1-3 missing job keywords naturally.
- Do NOT rewrite sections, add headings, change bullet styles, or reformat the document.
- Do NOT edit name, email, phone, or section titles.
- Only suggest in-place word swaps inside existing Experience, Skills, or Summary bullet text.
- NEVER rewrite entire skill category lines (e.g. "Languages: ..." or "Tools: ...") — only Experience bullet sentences.`

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

const KEYWORD_PLACEMENT_PROMPT = `You assign missing job keywords to the CORRECT existing skill category on a resume.
Return ONLY valid JSON:
{
  "placements": [
    { "keyword": "CSS", "category": "Tools" }
  ]
}

CRITICAL RULES:
- Use category labels EXACTLY as provided (case-sensitive match to the label before the colon).
- "Languages" is ONLY for programming languages (Python, Java, C++, JavaScript, TypeScript, Go, Rust, SQL, etc.).
- NEVER put CSS, HTML, CMS, accessibility, web performance, front-end, templates, or frameworks in "Languages".
- Web/front-end terms belong in Tools, MLOps, Frontend, or the closest dev-tools category — NOT Languages.
- ML/AI terms belong in Machine Learning, GenAI / LLMs, or MLOps — NOT Languages.
- Cloud/data terms belong in Data & Cloud or Data Engineering — NOT Languages.
- DevOps/Git/Docker/Kubernetes belong in MLOps or Tools — NOT Languages.
- If no category fits, use "Tools" — never Languages unless it is a programming language.
- One placement per keyword. Skip keywords already covered in the resume.`

export async function assignKeywordPlacementsWithAI(
  categories: Array<{ label: string; lineText: string }>,
  keywords: string[],
  jobTitle: string,
  resumeSnippet: string
): Promise<Array<{ keyword: string; category: string }>> {
  if (!keywords.length || !categories.length) return []

  const categoryList = categories.map((c) => `- ${c.lineText}`).join('\n')
  const userContent = `Job title: ${jobTitle}

Resume skill categories (use these labels exactly):
${categoryList}

Missing keywords to place:
${keywords.join(', ')}

Resume excerpt:
${resumeSnippet.slice(0, 4000)}`

  const runWith = async (model: string) => {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1200,
      system: KEYWORD_PLACEMENT_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    const block = response.content[0]
    const text = block && block.type === 'text' ? block.text : ''
    const parsed = extractJson<{ placements?: Array<{ keyword?: string; category?: string }> }>(
      text
    )
    return (parsed.placements || [])
      .filter((p) => p.keyword?.trim() && p.category?.trim())
      .map((p) => ({ keyword: p.keyword!.trim(), category: p.category!.trim() }))
  }

  try {
    return await runWith(FALLBACK_MODEL)
  } catch {
    return await runWith(PRIMARY_MODEL)
  }
}

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
  const resumeSnippet = resumeText.slice(0, 12_000)
  const jobSnippet = jobDescription?.slice(0, 6_000)
  const userContent = jobSnippet
    ? `Resume:\n${resumeSnippet}\n\nTarget Job Description:\n${jobSnippet}`
    : `Resume:\n${resumeSnippet}`

  const runWith = async (model: string) => {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: TAILOR_ATS_PROMPT,
      messages: [{ role: 'user', content: userContent }],
    })
    const block = response.content[0]
    const text = block && block.type === 'text' ? block.text : ''
    return normalizeAnalysis(extractJson<Partial<ATSAnalysis>>(text))
  }

  try {
    return await runWith(PRIMARY_MODEL)
  } catch (err) {
    console.error('[ANTHROPIC] Primary model failed, trying fallback:', err)
    try {
      return await runWith(FALLBACK_MODEL)
    } catch (err2) {
      console.error('[ANTHROPIC] Fallback failed, using keyword heuristic:', err2)
      return fallbackAnalysis(resumeText, jobDescription)
    }
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
