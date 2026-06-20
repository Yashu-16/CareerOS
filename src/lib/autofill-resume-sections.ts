/** Extract structured sections from plain-text resume for application autofill. */

const SECTION_END =
  /\n\s*(?:education|skills|projects|certifications|achievements|awards|publications|languages|interests|references|summary|objective|contact)\s*:?\s*\n/i

export function extractWorkExperienceSection(text: string | null | undefined): string | null {
  if (!text?.trim()) return null
  const m = text.match(
    /(?:^|\n)\s*(?:work\s+experience|professional\s+experience|employment\s+history|experience)\s*:?\s*\n([\s\S]*?)(?=$|\n\s*(?:education|skills|projects|certifications)\s*:?\s*\n)/i
  )
  const body = m?.[1]?.trim()
  if (body && body.length > 40) return body.slice(0, 8000)
  return null
}

export function extractEducationSection(text: string | null | undefined): string | null {
  if (!text?.trim()) return null
  const m = text.match(
    /(?:^|\n)\s*(?:education|academic\s+background|qualification)\s*:?\s*\n([\s\S]*?)(?=$|\n\s*(?:skills|projects|experience|certifications)\s*:?\s*\n)/i
  )
  const body = m?.[1]?.trim()
  if (body && body.length > 20) return body.slice(0, 4000)
  return null
}

export function formatEducationSummary(opts: {
  college?: string | null
  degree?: string | null
  graduationYear?: number | null
  educationSection?: string | null
}): string | null {
  const parts: string[] = []
  if (opts.degree) parts.push(opts.degree)
  if (opts.college) parts.push(opts.college)
  if (opts.graduationYear) parts.push(String(opts.graduationYear))
  const structured = parts.length ? parts.join(' — ') : null
  if (structured) return structured
  return opts.educationSection?.slice(0, 2000) || null
}

export function experienceLevelToYears(level: string | null | undefined): string {
  switch (level) {
    case 'FRESHER':
      return '0'
    case 'ZERO_TO_TWO':
      return '1'
    case 'TWO_TO_FIVE':
      return '3'
    case 'FIVE_PLUS':
      return '6'
    default:
      return '0'
  }
}

export function experienceLevelLabel(level: string | null | undefined): string {
  switch (level) {
    case 'FRESHER':
      return 'Fresher'
    case 'ZERO_TO_TWO':
      return '0-2 years'
    case 'TWO_TO_FIVE':
      return '2-5 years'
    case 'FIVE_PLUS':
      return '5+ years'
    default:
      return 'Fresher'
  }
}
