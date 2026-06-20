import type { Job } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { extractSkillsFromText } from '@/lib/resume-skills'
import { FIT_SCORE_POOL, JOB_FIT_SCORE_SELECT, JOB_LIST_SELECT } from '@/lib/job-list-select'
import { freshJobWhere } from '@/lib/job-freshness'

/**
 * Profile signals used to score how well a user fits a job. All fields are
 * optional — the score is computed only from whatever signal is available.
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
  'india', 'company', 'required', 'preferred', 'must', 'ability', 'strong', 'good',
])

function tokenize(text: string): string[] {
  return (text || '').toLowerCase().match(/[a-z0-9+#.]+/g) || []
}

function uniqueTokens(text: string): string[] {
  return Array.from(new Set(tokenize(text)))
}

function normalizeSkill(s: string): string {
  return s.toLowerCase().trim().replace(/\.js$/i, '').replace(/\s+/g, ' ')
}

/** True when a profile skill matches anywhere in the job haystack. */
function skillMatches(skill: string, haystack: string): boolean {
  const s = normalizeSkill(skill)
  if (!s) return false
  if (haystack.includes(s)) return true
  // react ↔ react.js, node ↔ node.js
  const compact = s.replace(/\s/g, '')
  return haystack.includes(compact) || haystack.includes(`${compact}.js`)
}

/** Merge profile skills with skills detected in resume text. */
export function buildFitProfile(
  user: {
    skills?: string[]
    targetRole?: string | null
    experienceLevel?: string | null
    city?: string | null
  },
  resume?: { parsedText?: string | null } | null
): FitProfile {
  const resumeText = resume?.parsedText?.trim() || null
  const resumeSkills = resumeText ? extractSkillsFromText(resumeText) : []
  const profileSkills = (user.skills || []).map((s) => s.trim()).filter(Boolean)
  const skills = [...new Set([...profileSkills, ...resumeSkills])]

  let targetRole = user.targetRole
  if (!targetRole && resumeText) {
    const roleLine = resumeText.match(
      /\b(software engineer|software developer|full[\s-]?stack developer|backend developer|frontend developer|data scientist|data analyst|product manager|devops engineer|business analyst)\b/i
    )
    if (roleLine) targetRole = roleLine[1]
  }

  return {
    skills,
    targetRole,
    experienceLevel: user.experienceLevel,
    city: user.city,
    resumeText,
  }
}

/** Load the user's fit profile from DB (profile + active resume). */
export async function loadFitProfile(userId: string): Promise<FitProfile> {
  const [profile, resume] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { skills: true, targetRole: true, experienceLevel: true, city: true },
    }),
    prisma.resume.findFirst({
      where: { userId, isActive: true },
      select: { parsedText: true },
    }),
  ])
  return buildFitProfile(profile ?? {}, resume)
}

/**
 * Compute a 0..1 fit score for a job given a user's profile/resume. When a
 * resume is present, keyword overlap from the full resume text is weighted
 * heavily so scores reflect actual resume content.
 */
export function computeFitScore(
  job: Pick<Job, 'title' | 'company' | 'skills' | 'location' | 'locationType'> & {
    description?: string | null
  },
  profile: FitProfile
): number {
  const haystack = `${job.title} ${job.company} ${job.description || ''} ${(job.skills || []).join(' ')} ${job.location}`.toLowerCase()
  const titleText = (job.title || '').toLowerCase()
  const hasResume = Boolean(profile.resumeText?.trim())

  let acc = 0
  let totalWeight = 0

  // --- Skills overlap ---
  const skills = (profile.skills || []).map(normalizeSkill).filter(Boolean)
  if (skills.length) {
    const matched = skills.filter((s) => skillMatches(s, haystack)).length
    acc += 0.35 * (matched / skills.length)
    totalWeight += 0.35
  }

  // --- Target role match (title-weighted) ---
  const roleTokens = tokenize(profile.targetRole || '').filter((t) => t.length > 2 && !STOPWORDS.has(t))
  if (roleTokens.length) {
    const inTitle = roleTokens.filter((t) => titleText.includes(t)).length
    const inBody = roleTokens.filter((t) => haystack.includes(t)).length
    const ratio = Math.min(1, (inTitle * 1.5 + (inBody - inTitle) * 0.4) / (roleTokens.length * 1.5))
    acc += 0.2 * Math.min(1, ratio)
    totalWeight += 0.2
  }

  // --- Resume keyword overlap (primary signal when resume exists) ---
  if (profile.resumeText) {
    const resumeTokens = uniqueTokens(profile.resumeText).filter((t) => t.length > 3 && !STOPWORDS.has(t))
    const jobTokens = uniqueTokens(`${job.title} ${job.description || ''} ${(job.skills || []).join(' ')}`)
    if (resumeTokens.length && jobTokens.length) {
      const resumeSet = new Set(resumeTokens)
      let overlap = 0
      for (const t of jobTokens) {
        if (resumeSet.has(t)) overlap++
      }
      const denom = Math.max(8, Math.min(jobTokens.length, 35))
      acc += (hasResume ? 0.35 : 0.2) * Math.min(1, overlap / denom)
      totalWeight += hasResume ? 0.35 : 0.2
    }
  }

  // --- Location ---
  const city = (profile.city || '').toLowerCase().trim()
  if (city) {
    let locScore = 0.3
    if ((job.location || '').toLowerCase().includes(city)) locScore = 1
    else if (job.locationType === 'REMOTE') locScore = 0.85
    acc += 0.07 * locScore
    totalWeight += 0.07
  }

  // --- Experience-level / seniority alignment ---
  const exp = profile.experienceLevel
  if (exp) {
    const senior = /\b(senior|sr|lead|principal|staff|head|manager|director|architect|vp)\b/.test(titleText)
    const junior = /\b(intern|graduate|trainee|junior|jr|fresher|entry|associate)\b/.test(titleText)
    let expScore = 0.6
    if (exp === 'FRESHER' || exp === 'ZERO_TO_TWO') {
      expScore = junior ? 1 : senior ? 0.15 : 0.55
    } else if (exp === 'FIVE_PLUS') {
      expScore = senior ? 1 : junior ? 0.2 : 0.65
    } else {
      expScore = senior && !junior ? 0.45 : 0.7
    }
    acc += 0.03 * expScore
    totalWeight += 0.03
  }

  if (totalWeight === 0) return 0.35
  const score = acc / totalWeight
  return Math.max(0.05, Math.min(0.99, score))
}

/** Score active jobs and return the top matches for dashboard/widgets. */
export async function getTopMatchedJobs(userId: string, limit = 10) {
  const fitProfile = await loadFitProfile(userId)
  const jobs = await prisma.job.findMany({
    where: freshJobWhere(),
    select: JOB_FIT_SCORE_SELECT,
    orderBy: { postedAt: 'desc' },
    take: FIT_SCORE_POOL,
  })

  return jobs
    .map((job) => {
      const { description: _d, ...rest } = job
      return { ...rest, matchScore: computeFitScore(job, fitProfile) }
    })
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
    .slice(0, limit)
}
