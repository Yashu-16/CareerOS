import { analyzeResumeATS, type ATSAnalysis } from '@/lib/anthropic'
import {
  patchDocxText,
  extractDocxPlainText,
  extractSkillCategoriesFromBuffer,
  phraseInDocxText,
  type DocxTextEdit,
} from '@/lib/resume-docx-patch'
import {
  resolveKeywordPlacements,
  type KeywordPlacement,
} from '@/lib/resume-keyword-placement'
import { getResumeBuffer, uploadResume, buildResumeKey } from '@/lib/resume-storage'
import { parseResumeBuffer } from '@/lib/resume-parser'
import { prisma } from '@/lib/prisma'
import mammoth from 'mammoth'

export interface TailorResult {
  tailoredResumeId: string
  overallScore: number
  matchedKeywords: string[]
  missingKeywords: string[]
  addedKeywords: string[]
  appliedEditsCount: number
  suggestions: ATSAnalysis['suggestions']
  filename: string
  mimeType: string
  downloadPath: string
}

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function isDocxResume(resume: { mimeType: string; filename: string }): boolean {
  return (
    resume.mimeType.includes('wordprocessingml') ||
    resume.filename.toLowerCase().endsWith('.docx')
  )
}

export function tailoredDocxFilename(baseName: string, company: string): string {
  const stem = baseName.replace(/\.(pdf|docx?|doc)$/i, '')
  const co = company.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').slice(0, 40)
  return `${stem}_tailored_${co || 'role'}.docx`
}

export function buildEditsFromAnalysis(analysis: ATSAnalysis): DocxTextEdit[] {
  return buildEditsFromSuggestions(analysis.suggestions)
}

export function buildEditsFromSuggestions(
  suggestions: ATSAnalysis['suggestions']
): DocxTextEdit[] {
  return suggestions
    .filter((s) => s.original?.trim() && s.suggested?.trim() && s.original !== s.suggested)
    .map((s) => ({ original: s.original.trim(), suggested: s.suggested.trim() }))
}

function buildFallbackEdits(resumeText: string, missingKeywords: string[]): DocxTextEdit[] {
  const lines = resumeText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 24 && l.length <= 180)

  const edits: DocxTextEdit[] = []
  const usedLines = new Set<string>()

  for (const kw of missingKeywords.slice(0, 6)) {
    if (edits.length >= 4) break
    const line = lines.find(
      (l) =>
        !usedLines.has(l) &&
        !l.toLowerCase().includes(kw.toLowerCase()) &&
        /[a-z]/i.test(l) &&
        !/^[A-Za-z][^:]{0,50}:\s/.test(l)
    )
    if (!line) continue
    usedLines.add(line)
    edits.push({
      original: line,
      suggested: `${line.replace(/\.\s*$/, '')}, ${kw}`,
    })
  }

  return edits
}

function filterApplicableEdits(edits: DocxTextEdit[], docxPlain: string, resumeText: string) {
  return edits.filter(
    (edit) => phraseInDocxText(edit.original, docxPlain) || phraseInDocxText(edit.original, resumeText)
  )
}

async function textFromPatchedDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer })
  return value.trim()
}

async function buildKeywordPlacements(
  sourceBuffer: Buffer,
  missingKeywords: string[],
  jobTitle: string,
  resumeText: string
): Promise<KeywordPlacement[]> {
  const categories = await extractSkillCategoriesFromBuffer(sourceBuffer)
  const docxPlain = await extractDocxPlainText(sourceBuffer)
  const toPlace = missingKeywords.filter(
    (k) => !docxPlain.toLowerCase().includes(k.trim().toLowerCase())
  )
  if (!toPlace.length || !categories.length) return []
  return resolveKeywordPlacements(categories, toPlace, jobTitle, resumeText)
}

/** Patch the user's DOCX in place — layout, fonts, and alignment are preserved. */
export async function rebuildTailoredBuffer(
  baseResume: { s3Key: string; mimeType: string; filename: string; parsedText?: string | null },
  edits: DocxTextEdit[],
  opts?: {
    missingKeywords?: string[]
    jobTitle?: string
    resumeText?: string
    placements?: KeywordPlacement[]
  }
): Promise<{
  buffer: Buffer
  mimeType: string
  parsedText: string
  appliedEdits: DocxTextEdit[]
  wovenKeywords: string[]
}> {
  if (!isDocxResume(baseResume)) {
    throw new Error('DOCX_REQUIRED')
  }

  const sourceBuffer = await getResumeBuffer(baseResume.s3Key)
  const placements =
    opts?.placements ??
    (await buildKeywordPlacements(
      sourceBuffer,
      opts?.missingKeywords ?? [],
      opts?.jobTitle ?? 'Role',
      opts?.resumeText ?? baseResume.parsedText ?? ''
    ))

  const { buffer, appliedEdits, wovenKeywords } = await patchDocxText(
    sourceBuffer,
    edits,
    placements
  )

  return {
    buffer,
    mimeType: DOCX_MIME,
    parsedText: await textFromPatchedDocx(buffer),
    appliedEdits,
    wovenKeywords,
  }
}

export async function tailorResumeForJob(
  userId: string,
  jobId: string
): Promise<TailorResult> {
  const [job, resume] = await Promise.all([
    prisma.job.findUnique({ where: { id: jobId } }),
    prisma.resume.findFirst({ where: { userId, isActive: true } }),
  ])
  if (!job) throw new Error('JOB_NOT_FOUND')
  if (!resume) throw new Error('NO_RESUME')
  if (!isDocxResume(resume)) throw new Error('DOCX_REQUIRED')

  const jobDescription = `${job.title} at ${job.company}\n\n${job.description}\n\n${job.requirements || ''}\n\nSkills: ${(job.skills || []).join(', ')}`

  const sourceBuffer = await getResumeBuffer(resume.s3Key)
  const docxPlain = await extractDocxPlainText(sourceBuffer)

  let resumeText = resume.parsedText
  if (!resumeText) {
    resumeText = await parseResumeBuffer(sourceBuffer, resume.mimeType)
  }
  if (!resumeText.trim()) {
    resumeText = docxPlain
  }

  const analysis = await analyzeResumeATS(resumeText, jobDescription)
  let edits = filterApplicableEdits(buildEditsFromAnalysis(analysis), docxPlain, resumeText)

  if (!edits.length && analysis.missingKeywords.length) {
    edits = filterApplicableEdits(
      buildFallbackEdits(resumeText, analysis.missingKeywords),
      docxPlain,
      resumeText
    )
  }

  const missingKeywords = analysis.missingKeywords.slice(0, 10)
  const placements = await buildKeywordPlacements(
    sourceBuffer,
    missingKeywords,
    job.title,
    resumeText
  )

  const { buffer: outBuffer, mimeType: outMime, parsedText, appliedEdits, wovenKeywords } =
    await rebuildTailoredBuffer(resume, edits, { placements })

  const addedKeywords = [
    ...new Set([
      ...wovenKeywords,
      ...appliedEdits.flatMap((edit) => {
        const diff = edit.suggested
          .replace(edit.original, '')
          .split(/[,;|/•\-\s]+/)
          .map((s) => s.trim())
          .filter(Boolean)
        return diff.filter((d) => missingKeywords.some((m) => m.toLowerCase() === d.toLowerCase()))
      }),
    ]),
  ].slice(0, 10)

  const outName = tailoredDocxFilename(resume.filename, job.company)
  const key = buildResumeKey(userId, outName)
  await uploadResume(key, outBuffer, outMime)

  const record = await prisma.tailoredResume.upsert({
    where: { userId_jobId: { userId, jobId } },
    update: {
      baseResumeId: resume.id,
      s3Key: key,
      filename: outName,
      mimeType: outMime,
      parsedText,
      overallScore: analysis.overallScore,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords,
      addedKeywords,
      suggestions: analysis.suggestions,
    },
    create: {
      userId,
      jobId,
      baseResumeId: resume.id,
      s3Key: key,
      filename: outName,
      mimeType: outMime,
      parsedText,
      overallScore: analysis.overallScore,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords,
      addedKeywords,
      suggestions: analysis.suggestions,
    },
  })

  return {
    tailoredResumeId: record.id,
    overallScore: analysis.overallScore,
    matchedKeywords: analysis.matchedKeywords,
    missingKeywords: analysis.missingKeywords,
    addedKeywords,
    appliedEditsCount: appliedEdits.length + wovenKeywords.length,
    suggestions: analysis.suggestions as ATSAnalysis['suggestions'],
    filename: outName,
    mimeType: outMime,
    downloadPath: `/api/apply/tailored/${record.id}/download`,
  }
}
