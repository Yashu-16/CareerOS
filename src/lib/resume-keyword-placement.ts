import { assignKeywordPlacementsWithAI } from '@/lib/anthropic'

export interface SkillCategory {
  label: string
  lineText: string
}

export interface KeywordPlacement {
  keyword: string
  category: string
}

const PROGRAMMING_LANGUAGES = new Set([
  'python',
  'java',
  'javascript',
  'typescript',
  'c++',
  'c#',
  'c',
  'go',
  'golang',
  'rust',
  'ruby',
  'php',
  'swift',
  'kotlin',
  'scala',
  'r',
  'matlab',
  'sql',
  'perl',
  'haskell',
  'lua',
  'dart',
  'objective-c',
  'f#',
  'vb.net',
])

export function isProgrammingLanguage(keyword: string): boolean {
  const n = keyword.trim().toLowerCase()
  return PROGRAMMING_LANGUAGES.has(n)
}

export function isSkillToken(keyword: string): boolean {
  const trimmed = keyword.trim()
  if (!trimmed || trimmed.length > 45) return false
  return trimmed.split(/\s+/).length <= 4
}

function findCategory(categories: SkillCategory[], ...patterns: RegExp[]): string | null {
  for (const cat of categories) {
    const label = cat.label.toLowerCase()
    if (patterns.some((p) => p.test(label))) return cat.label
  }
  return null
}

/** Rule-based fallback: map each keyword to the best existing resume category. */
export function ruleBasedKeywordPlacements(
  keywords: string[],
  categories: SkillCategory[]
): KeywordPlacement[] {
  if (!categories.length) return []

  const placements: KeywordPlacement[] = []

  for (const raw of keywords) {
    const keyword = raw.trim()
    if (!keyword || !isSkillToken(keyword)) continue

    const kw = keyword.toLowerCase()
    let category: string | null = null

    if (isProgrammingLanguage(keyword)) {
      category = findCategory(categories, /^languages?$/)
    } else if (
      /css|html|sass|scss|tailwind|webpack|vite|react|angular|vue|svelte|next\.?js|front.?end|frontend|headless|cms|accessibility|cross-browser|browser compat|web perf|component template|responsive|ui\b|ux\b|semantic html/.test(
        kw
      )
    ) {
      category =
        findCategory(categories, /front.?end|frontend|web/) ??
        findCategory(categories, /^tools?$|devops/) ??
        findCategory(categories, /mlops/)
    } else if (
      /pytorch|tensorflow|sklearn|scikit|hugging|llm|rag|langchain|embedding|nlp|machine learning|deep learning|neural|transformer|bert|gpt/.test(
        kw
      )
    ) {
      category =
        findCategory(categories, /genai|llm/) ??
        findCategory(categories, /machine learning|^ml$/)
    } else if (
      /aws|gcp|azure|cloud|bigquery|snowflake|teradata|etl|pipeline|warehouse|spark|kafka|databricks|redshift/.test(
        kw
      )
    ) {
      category = findCategory(categories, /data|cloud/)
    } else if (
      /docker|kubernetes|k8s|git|github|gitlab|ci\/cd|jenkins|terraform|ansible|fastapi|rest api|vercel|mlops|deploy|github actions/.test(
        kw
      )
    ) {
      category = findCategory(categories, /mlops|devops/) ?? findCategory(categories, /^tools?$/)
    } else if (/power bi|tableau|excel|jupyter|figma|jira|confluence/.test(kw)) {
      category = findCategory(categories, /^tools?$/)
    } else {
      category =
        findCategory(categories, /^tools?$|mlops|devops|data|cloud|machine learning|genai/) ??
        categories[categories.length - 1]?.label ??
        null
    }

    category = enforceCategory(keyword, category, categories)
    if (category) placements.push({ keyword, category })
  }

  return placements
}

export function enforceCategory(
  keyword: string,
  category: string | null,
  categories: SkillCategory[]
): string | null {
  if (!category) return null

  const match = categories.find((c) => c.label.toLowerCase() === category.toLowerCase())
  if (!match) {
    return ruleBasedKeywordPlacements([keyword], categories)[0]?.category ?? null
  }

  if (/^languages?$/i.test(match.label) && !isProgrammingLanguage(keyword)) {
    const alt =
      findCategory(categories, /^tools?$|mlops|devops|front.?end|web/) ??
      categories.find((c) => !/^languages?$/i.test(c.label))?.label
    return alt ?? null
  }

  return match.label
}

export async function resolveKeywordPlacements(
  categories: SkillCategory[],
  keywords: string[],
  jobTitle: string,
  resumeSnippet: string
): Promise<KeywordPlacement[]> {
  const tokens = keywords.filter(isSkillToken)
  if (!tokens.length || !categories.length) return []

  try {
    const aiPlacements = await assignKeywordPlacementsWithAI(
      categories,
      tokens,
      jobTitle,
      resumeSnippet
    )
    const validated = aiPlacements
      .map((p) => ({
        keyword: p.keyword.trim(),
        category: enforceCategory(p.keyword, p.category, categories),
      }))
      .filter((p): p is KeywordPlacement => Boolean(p.keyword && p.category))

    const placed = new Set(validated.map((p) => p.keyword.toLowerCase()))
    const remaining = tokens.filter((k) => !placed.has(k.toLowerCase()))
    const fallback = ruleBasedKeywordPlacements(remaining, categories)

    return dedupePlacements([...validated, ...fallback])
  } catch (err) {
    console.error('[KEYWORD_PLACEMENT] AI failed, using rules:', err)
    return dedupePlacements(ruleBasedKeywordPlacements(tokens, categories))
  }
}

function dedupePlacements(placements: KeywordPlacement[]): KeywordPlacement[] {
  const seen = new Set<string>()
  const out: KeywordPlacement[] = []
  for (const p of placements) {
    const key = p.keyword.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(p)
  }
  return out
}
