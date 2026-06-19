import type { Job } from '@prisma/client'

/**
 * Profile signals used to score how well a user fits a job. All fields are
 * optional — the score is computed only from whatever signal is available, so
 * it degrades gracefully (e.g. before a resume is uploaded).
 */
export interface FitProfile {
  skills: string[]
  targetRole?: string | null
  experienceLevel?: string | null
  city?: string | null
  resumeText?: string | null
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'you', 'your', 'are', 'our', 'will', 'this', 'that',
  'from', 'have', 'has', 'job', 'role', 'work', 'team', 'experience', 'years', 'year',
  'india', 'engineer', 'developer', // too generic on their own; role match handles these contextually
])

function tokenize(text: string): string[] {
  return (text || '').toLowerCase().match(/[a-z0-9+#.]+/g) || []
}

function uniqueTokens(text: string): string[] {
  return Array.from(new Set(tokenize(text)))
}

/**
 * Compute a 0..1 fit score for a job given a user's profile/resume. Combines
 * skills overlap, target-role match, resume keyword overlap, location, and
 * experience-level seniority alignment. Purely lexical — no external services.
 */
export function computeFitScore(
  job: Pick<Job, 'title' | 'company' | 'description' | 'skills' | 'location' | 'locationType'>,
  profile: FitProfile
): number {
  const haystack = `${job.title} ${job.company} ${job.description} ${(job.skills || []).join(' ')} ${job.location}`.toLowerCase()
  const titleText = (job.title || '').toLowerCase()

  let acc = 0
  let totalWeight = 0

  // --- Skills overlap (most important) ---
  const skills = (profile.skills || []).map((s) => s.toLowerCase().trim()).filter(Boolean)
  if (skills.length) {
    const matched = skills.filter((s) => haystack.includes(s)).length
    acc += 0.4 * (matched / skills.length)
    totalWeight += 0.4
  }

  // --- Target role match (title-weighted) ---
  const roleTokens = tokenize(profile.targetRole || '').filter((t) => t.length > 2)
  if (roleTokens.length) {
    const inTitle = roleTokens.filter((t) => titleText.includes(t)).length
    const inBody = roleTokens.filter((t) => haystack.includes(t)).length
    const ratio = Math.min(1, (inTitle + (inBody - inTitle) * 0.5) / roleTokens.length)
    acc += 0.25 * ratio
    totalWeight += 0.25
  }

  // --- Resume keyword overlap with the job's most specific terms ---
  if (profile.resumeText) {
    const resumeTokens = uniqueTokens(profile.resumeText).filter((t) => t.length > 3 && !STOPWORDS.has(t))
    if (resumeTokens.length) {
      const jobTokens = new Set<string>([
        ...tokenize(job.title),
        ...(job.skills || []).flatMap((s) => tokenize(s)),
      ])
      const resumeSet = new Set(resumeTokens)
      let overlap = 0
      for (const t of jobTokens) if (resumeSet.has(t)) overlap++
      const denom = Math.max(5, Math.min(jobTokens.size, 20))
      acc += 0.2 * Math.min(1, overlap / denom)
      totalWeight += 0.2
    }
  }

  // --- Location ---
  const city = (profile.city || '').toLowerCase().trim()
  if (city) {
    let locScore = 0.3
    if ((job.location || '').toLowerCase().includes(city)) locScore = 1
    else if (job.locationType === 'REMOTE') locScore = 0.85
    acc += 0.1 * locScore
    totalWeight += 0.1
  }

  // --- Experience-level / seniority alignment ---
  const exp = profile.experienceLevel
  if (exp) {
    const senior = /\b(senior|sr|lead|principal|staff|head|manager|director|architect|vp)\b/.test(titleText)
    const junior = /\b(intern|graduate|trainee|junior|jr|fresher|entry|associate)\b/.test(titleText)
    let expScore = 0.6
    if (exp === 'FRESHER' || exp === 'ZERO_TO_TWO') {
      expScore = junior ? 1 : senior ? 0.2 : 0.6
    } else if (exp === 'FIVE_PLUS') {
      expScore = senior ? 1 : junior ? 0.3 : 0.6
    } else {
      expScore = 0.65
    }
    acc += 0.05 * expScore
    totalWeight += 0.05
  }

  if (totalWeight === 0) return 0.5
  const score = acc / totalWeight
  return Math.max(0.05, Math.min(0.99, score))
}
