import { prisma } from '@/lib/prisma'
import {
  extractEducationSection,
  extractWorkExperienceSection,
  experienceLevelLabel,
  experienceLevelToYears,
  formatEducationSummary,
} from '@/lib/autofill-resume-sections'

export interface AutofillFieldRule {
  /** Lowercase keywords matched against field labels/names/ids. */
  keywords: string[]
  /** Skip if haystack contains any of these (avoids "company name" matching "name"). */
  exclude?: string[]
  value: string
  /** Higher priority rules win when multiple match the same field. */
  priority?: number
}

export interface AutofillProfile {
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string | null
  gender: string | null
  city: string | null
  state: string | null
  country: string | null
  pincode: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  portfolioUrl: string | null
  skills: string[]
  targetRole: string | null
  targetIndustry: string | null
  experienceLevel: string | null
  experienceLevelLabel: string
  yearsOfExperience: string
  college: string | null
  degree: string | null
  graduationYear: number | null
  educationSummary: string | null
  educationText: string | null
  workExperienceText: string | null
  bio: string | null
  resumeText: string | null
  /** Common yes/no application answers */
  workAuthorization: string
  requiresSponsorship: string
  willingToRelocate: string
  noticePeriod: string
  currentCtc: string
  expectedCtc: string
  /** Keyword rules for the extension content script */
  fieldRules: AutofillFieldRule[]
  tailoredResumeId: string | null
  tailoredResumeDownloadUrl: string | null
  tailoredResumeFilename: string | null
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

function rule(
  keywords: string[],
  value: string | null | undefined,
  opts?: { exclude?: string[]; priority?: number }
): AutofillFieldRule | null {
  if (!value?.trim()) return null
  return { keywords, value: value.trim(), exclude: opts?.exclude, priority: opts?.priority ?? 50 }
}

/** Build ordered keyword rules — extension matches fields against these. */
export function buildAutofillFieldRules(p: Omit<AutofillProfile, 'fieldRules'>): AutofillFieldRule[] {
  const skillsJoined = p.skills?.join(', ') || ''
  const rules: Array<AutofillFieldRule | null> = [
    rule(['first_name', 'firstname', 'first name', 'given name', 'fname'], p.firstName, {
      exclude: ['last', 'company', 'employer'],
      priority: 100,
    }),
    rule(['last_name', 'lastname', 'last name', 'surname', 'family name', 'lname'], p.lastName, {
      exclude: ['first', 'company'],
      priority: 100,
    }),
    rule(['full name', 'legal name', 'candidate name', 'applicant name'], p.fullName, {
      exclude: ['company', 'employer', 'university', 'school', 'reference'],
      priority: 90,
    }),
    rule(['email', 'e-mail', 'email address'], p.email, { priority: 100 }),
    rule(['phone', 'mobile', 'telephone', 'tel', 'contact number', 'cell'], p.phone, { priority: 95 }),
    rule(['gender', 'sex'], p.gender, { priority: 90 }),
    rule(['city', 'town'], p.city, { exclude: ['university', 'college', 'school'], priority: 80 }),
    rule(['state', 'province', 'region'], p.state, { priority: 80 }),
    rule(['country', 'nation'], p.country, { priority: 80 }),
    rule(['zip', 'postal', 'pincode', 'pin code', 'postcode'], p.pincode, { priority: 80 }),
    rule(['address', 'street', 'current address'], p.city ? `${p.city}${p.state ? `, ${p.state}` : ''}` : null, {
      exclude: ['email', 'url', 'linkedin'],
      priority: 70,
    }),
    rule(['location', 'current location'], p.city, { exclude: ['job', 'preferred', 'relocation'], priority: 75 }),
    rule(['linkedin', 'linked in'], p.linkedinUrl, { priority: 85 }),
    rule(['github', 'git hub'], p.githubUrl, { priority: 85 }),
    rule(['portfolio', 'personal website', 'website', 'personal site', 'homepage'], p.portfolioUrl, {
      exclude: ['company', 'employer'],
      priority: 80,
    }),
    rule(['college', 'university', 'school', 'institution', 'institute'], p.college, { priority: 85 }),
    rule(['degree', 'qualification', 'major', 'field of study', 'discipline'], p.degree, { priority: 85 }),
    rule(['graduation', 'grad year', 'year of graduation', 'passing year', 'completion year'], p.graduationYear ? String(p.graduationYear) : null, {
      priority: 85,
    }),
    rule(['education', 'academic background', 'educational background'], p.educationText || p.educationSummary, {
      priority: 75,
    }),
    rule(['gpa', 'cgpa', 'grade'], null, { priority: 0 }),
    rule(['skills', 'technical skills', 'key skills', 'competencies'], skillsJoined, { priority: 80 }),
    rule(['current role', 'current title', 'current position', 'job title', 'designation'], p.targetRole, {
      exclude: ['desired', 'expected', 'preferred'],
      priority: 70,
    }),
    rule(['desired role', 'target role', 'position applying', 'role applying'], p.targetRole, { priority: 75 }),
    rule(['industry', 'sector', 'target industry'], p.targetIndustry, { priority: 70 }),
    rule(['years of experience', 'total experience', 'experience years', 'yoe'], p.yearsOfExperience, { priority: 85 }),
    rule(['experience level', 'seniority'], p.experienceLevelLabel, { priority: 80 }),
    rule(['work experience', 'employment history', 'professional experience', 'previous experience'], p.workExperienceText, {
      priority: 75,
    }),
    rule(['employer', 'current company', 'present employer', 'organization'], null, { priority: 0 }),
    rule(['cover letter', 'motivation', 'why do you want', 'why are you interested', 'tell us about yourself', 'about you', 'summary', 'professional summary'], p.bio || p.resumeText?.slice(0, 2000), {
      priority: 70,
    }),
    rule(['resume', 'paste your resume', 'cv text', 'attach resume text'], p.resumeText?.slice(0, 12000), {
      priority: 65,
    }),
    rule(['work authorization', 'authorised to work', 'authorized to work', 'legally authorized', 'eligible to work'], p.workAuthorization, {
      priority: 90,
    }),
    rule(['sponsorship', 'visa sponsorship', 'require sponsorship', 'work visa'], p.requiresSponsorship, { priority: 90 }),
    rule(['relocate', 'relocation', 'willing to relocate'], p.willingToRelocate, { priority: 85 }),
    rule(['notice period', 'availability', 'start date', 'when can you join'], p.noticePeriod, { priority: 80 }),
    rule(['current ctc', 'current salary', 'present ctc', 'current compensation'], p.currentCtc, { priority: 75 }),
    rule(['expected ctc', 'expected salary', 'salary expectation', 'desired salary'], p.expectedCtc, { priority: 75 }),
    rule(['how did you hear', 'source', 'referral', 'where did you hear'], 'CareerOS', { priority: 60 }),
    rule(['referral', 'referred by'], '', { priority: 0 }),
  ]

  return rules.filter((r): r is AutofillFieldRule => Boolean(r?.value))
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
  if (!phone && resumeText) phone = extractPhone(resumeText)

  const { first, last } = splitName(user.name)
  const workExperienceText = extractWorkExperienceSection(resumeText)
  const educationSection = extractEducationSection(resumeText)
  const educationSummary = formatEducationSummary({
    college: user.college,
    degree: user.degree,
    graduationYear: user.graduationYear,
    educationSection,
  })

  const base = {
    firstName: first,
    lastName: last,
    fullName: user.name || first || user.email.split('@')[0],
    email: user.email,
    phone,
    gender: user.gender,
    city: user.city,
    state: user.state,
    country: user.country || 'India',
    pincode: user.pincode,
    linkedinUrl: user.linkedinUrl,
    githubUrl: user.githubUrl,
    portfolioUrl: user.portfolioUrl,
    skills: user.skills || [],
    targetRole: user.targetRole,
    targetIndustry: user.targetIndustry,
    experienceLevel: user.experienceLevel,
    experienceLevelLabel: experienceLevelLabel(user.experienceLevel),
    yearsOfExperience: experienceLevelToYears(user.experienceLevel),
    college: user.college,
    degree: user.degree,
    graduationYear: user.graduationYear,
    educationSummary,
    educationText: educationSection || educationSummary,
    workExperienceText,
    bio: user.bio,
    resumeText,
    workAuthorization: 'Yes',
    requiresSponsorship: 'No',
    willingToRelocate: 'Yes',
    noticePeriod: user.experienceLevel === 'FRESHER' ? 'Immediate' : '30 days',
    currentCtc: '',
    expectedCtc: '',
    tailoredResumeId: tailored?.id || null,
    tailoredResumeDownloadUrl: tailored ? `/api/apply/tailored/${tailored.id}/download` : null,
    tailoredResumeFilename: tailored?.filename || null,
    jobId: job?.id || null,
    jobTitle: job?.title || null,
    company: job?.company || null,
    applyUrl: job?.applyUrl || null,
  }

  return {
    ...base,
    fieldRules: buildAutofillFieldRules(base),
  }
}

/** Extract structured fields from resume text via AI (best-effort, cached on user). */
export async function enrichProfileFromResume(userId: string, resumeText: string): Promise<void> {
  try {
    const { extractProfileFromResume } = await import('@/lib/anthropic')
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
