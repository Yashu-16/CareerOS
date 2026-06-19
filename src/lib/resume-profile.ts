import type { ExperienceLevel, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { extractProfileFromResume } from '@/lib/anthropic'
import { extractSkillsFromText } from '@/lib/resume-skills'
import { clamp } from '@/lib/sanitize'

export interface ExtractedProfile {
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

const INDIAN_CITIES = [
  'Bengaluru', 'Bangalore', 'Mumbai', 'Delhi', 'New Delhi', 'Gurugram', 'Gurgaon', 'Noida',
  'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Chandigarh', 'Kochi',
  'Indore', 'Coimbatore', 'Nagpur', 'Lucknow', 'Bhopal',
]

const ROLE_PATTERNS = [
  /\b(software engineer|software developer|full[\s-]?stack developer|backend developer|frontend developer|web developer|mobile developer|devops engineer|data scientist|data analyst|business analyst|product manager|ui[\s/-]?ux designer|machine learning engineer|cloud engineer|qa engineer|sdet)\b/i,
]

function inferExperienceLevel(text: string): ExperienceLevel | null {
  const yearsMatch = text.match(/(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|exp)/i)
  if (yearsMatch) {
    const y = parseInt(yearsMatch[1], 10)
    if (y <= 0) return 'FRESHER'
    if (y <= 2) return 'ZERO_TO_TWO'
    if (y <= 5) return 'TWO_TO_FIVE'
    return 'FIVE_PLUS'
  }
  if (/\b(fresher|graduate|internship|intern\b|student|entry[\s-]?level)\b/i.test(text)) return 'FRESHER'
  if (/\b(senior|lead|principal|staff|manager|director|architect|5\+?\s*years?)\b/i.test(text)) return 'FIVE_PLUS'
  if (/\b(junior|associate|1[\s-]?2\s*years?|2\s*years?)\b/i.test(text)) return 'ZERO_TO_TWO'
  if (/\b(3[\s-]?5\s*years?|mid[\s-]?level)\b/i.test(text)) return 'TWO_TO_FIVE'
  return null
}

function inferTargetRole(text: string): string | null {
  for (const pattern of ROLE_PATTERNS) {
    const m = text.match(pattern)
    if (m) return m[1].replace(/\s+/g, ' ').trim()
  }
  return null
}

function inferCity(text: string): string | null {
  for (const city of INDIAN_CITIES) {
    if (new RegExp(`\\b${city}\\b`, 'i').test(text)) return city
  }
  return null
}

function extractUrls(text: string): Pick<ExtractedProfile, 'linkedinUrl' | 'githubUrl' | 'portfolioUrl'> {
  const linkedin = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s)]+/i)?.[0] || null
  const github = text.match(/https?:\/\/(?:www\.)?github\.com\/[^\s)]+/i)?.[0] || null
  const portfolio =
    text.match(/https?:\/\/[^\s)]+/gi)?.find((u) => !/linkedin|github|mailto:/i.test(u)) || null
  return { linkedinUrl: linkedin, githubUrl: github, portfolioUrl: portfolio }
}

/** Rule-based extraction when AI is unavailable. */
export function extractProfileHeuristic(resumeText: string): ExtractedProfile {
  const skills = extractSkillsFromText(resumeText)
  const gradMatch = resumeText.match(/\b(20\d{2}|19\d{2})\b/)
  const degreeMatch = resumeText.match(/\b(B\.?Tech|B\.?E|M\.?Tech|M\.?B\.?A|B\.?C\.?A|B\.?Sc|M\.?Sc|Ph\.?D|Bachelor|Master)\b/i)

  return {
    city: inferCity(resumeText),
    degree: degreeMatch?.[1] || null,
    graduationYear: gradMatch ? parseInt(gradMatch[1], 10) : null,
    targetRole: inferTargetRole(resumeText),
    experienceLevel: inferExperienceLevel(resumeText),
    skills,
    bio: resumeText.split('\n').find((l) => l.trim().length > 40)?.trim().slice(0, 500) || null,
    ...extractUrls(resumeText),
  }
}

/** AI extraction with heuristic fallback. */
export async function extractProfile(resumeText: string): Promise<ExtractedProfile> {
  const trimmed = resumeText.trim().slice(0, 12000)
  if (!trimmed) return {}

  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    try {
      const ai = await extractProfileFromResume(trimmed)
      const heuristic = extractProfileHeuristic(trimmed)
      return {
        ...heuristic,
        ...Object.fromEntries(Object.entries(ai).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && !v.length))),
        skills: [...new Set([...(ai.skills || []), ...(heuristic.skills || [])])].slice(0, 50),
      }
    } catch (err) {
      console.error('[RESUME_PROFILE] AI extraction failed, using heuristics:', err)
    }
  }
  return extractProfileHeuristic(trimmed)
}

function setIfPresent<T>(target: Prisma.UserUpdateInput, key: keyof Prisma.UserUpdateInput, value: T | null | undefined, updated: string[], label: string) {
  if (value == null || value === '') return
  ;(target as Record<string, unknown>)[key as string] = value
  updated.push(label)
}

/**
 * Parse a resume and push extracted fields into the user's profile so job
 * matching and the profile page reflect the latest upload.
 */
export async function syncUserProfileFromResume(userId: string, resumeText: string): Promise<{ updated: string[] }> {
  const extracted = await extractProfile(resumeText)
  const data: Prisma.UserUpdateInput = {}
  const updated: string[] = []

  setIfPresent(data, 'name', extracted.name, updated, 'name')
  setIfPresent(data, 'city', extracted.city, updated, 'city')
  setIfPresent(data, 'college', extracted.college, updated, 'college')
  setIfPresent(data, 'degree', extracted.degree, updated, 'degree')
  setIfPresent(data, 'graduationYear', extracted.graduationYear, updated, 'graduationYear')
  setIfPresent(data, 'targetRole', extracted.targetRole, updated, 'targetRole')
  setIfPresent(data, 'targetIndustry', extracted.targetIndustry, updated, 'targetIndustry')
  setIfPresent(data, 'experienceLevel', extracted.experienceLevel, updated, 'experienceLevel')
  setIfPresent(data, 'bio', extracted.bio ? clamp(extracted.bio, 500) : null, updated, 'bio')
  setIfPresent(data, 'linkedinUrl', extracted.linkedinUrl, updated, 'linkedinUrl')
  setIfPresent(data, 'githubUrl', extracted.githubUrl, updated, 'githubUrl')
  setIfPresent(data, 'portfolioUrl', extracted.portfolioUrl, updated, 'portfolioUrl')

  if (extracted.skills?.length) {
    data.skills = extracted.skills.slice(0, 50)
    updated.push('skills')
  }

  if (Object.keys(data).length) {
    await prisma.user.update({ where: { id: userId }, data })
  }

  return { updated }
}
