import { prisma } from '@/lib/prisma'
import { extractProfileFromResume } from '@/lib/anthropic'

export interface AutofillProfile {
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string | null
  city: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  portfolioUrl: string | null
  skills: string[]
  targetRole: string | null
  experienceLevel: string | null
  college: string | null
  degree: string | null
  graduationYear: number | null
  bio: string | null
  /** Plain-text resume for paste fields */
  resumeText: string | null
  /** Active tailored resume for a specific job (when jobId query param set) */
  tailoredResumeId: string | null
  tailoredResumeDownloadUrl: string | null
  tailoredResumeFilename: string | null
  /** Job context passed to extension for this apply session */
  jobId: string | null
  jobTitle: string | null
  company: string | null
  applyUrl: string | null
}

function splitName(full: string | null | undefined): { first: string; last: string } {
  const parts = (full || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return { first: '', last: '' }
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

function extractPhone(text: string | null | undefined): string | null {
  if (!text) return null
  const m = text.match(/(?:\+91[\s-]?)?[6-9]\d{9}|(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)
  return m ? m[0].replace(/\s+/g, ' ').trim() : null
}

export async function buildAutofillProfile(
  userId: string,
  opts?: { jobId?: string | null }
): Promise<AutofillProfile> {
  const [user, resume, tailored, job] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.resume.findFirst({ where: { userId, isActive: true } }),
    opts?.jobId
      ? prisma.tailoredResume.findUnique({ where: { userId_jobId: { userId, jobId: opts.jobId } } })
      : null,
    opts?.jobId ? prisma.job.findUnique({ where: { id: opts.jobId } }) : null,
  ])

  if (!user) throw new Error('USER_NOT_FOUND')

  let resumeText = tailored?.parsedText || resume?.parsedText || null
  if (!resumeText && resume) {
    try {
      const { getResumeBuffer } = await import('@/lib/resume-storage')
      const { parseResumeBuffer } = await import('@/lib/resume-parser')
      const buf = await getResumeBuffer(resume.s3Key)
      resumeText = await parseResumeBuffer(buf, resume.mimeType)
    } catch {
      resumeText = null
    }
  }

  let phone = user.phone
  if (!phone && resumeText) {
    phone = extractPhone(resumeText)
  }

  const { first, last } = splitName(user.name)

  return {
    firstName: first,
    lastName: last,
    fullName: user.name || first || user.email.split('@')[0],
    email: user.email,
    phone,
    city: user.city,
    linkedinUrl: user.linkedinUrl,
    githubUrl: user.githubUrl,
    portfolioUrl: user.portfolioUrl,
    skills: user.skills || [],
    targetRole: user.targetRole,
    experienceLevel: user.experienceLevel,
    college: user.college,
    degree: user.degree,
    graduationYear: user.graduationYear,
    bio: user.bio,
    resumeText,
    tailoredResumeId: tailored?.id || null,
    tailoredResumeDownloadUrl: tailored ? `/api/apply/tailored/${tailored.id}/download` : null,
    tailoredResumeFilename: tailored?.filename || null,
    jobId: job?.id || null,
    jobTitle: job?.title || null,
    company: job?.company || null,
    applyUrl: job?.applyUrl || null,
  }
}

/** Extract structured fields from resume text via AI (best-effort, cached on user). */
export async function enrichProfileFromResume(userId: string, resumeText: string): Promise<void> {
  try {
    const extracted = await extractProfileFromResume(resumeText)
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: extracted.name || undefined,
        city: extracted.city || undefined,
        college: extracted.college || undefined,
        degree: extracted.degree || undefined,
        graduationYear: extracted.graduationYear || undefined,
        targetRole: extracted.targetRole || undefined,
        targetIndustry: extracted.targetIndustry || undefined,
        experienceLevel: extracted.experienceLevel || undefined,
        skills: extracted.skills?.length ? extracted.skills : undefined,
        bio: extracted.bio || undefined,
        linkedinUrl: extracted.linkedinUrl || undefined,
        githubUrl: extracted.githubUrl || undefined,
        portfolioUrl: extracted.portfolioUrl || undefined,
        phone: extractPhone(resumeText) || undefined,
      },
    })
  } catch (err) {
    console.error('[AUTOFILL] profile enrich failed:', err)
  }
}
