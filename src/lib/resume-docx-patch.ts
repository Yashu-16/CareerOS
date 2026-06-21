import JSZip from 'jszip'
import type { KeywordPlacement, SkillCategory } from '@/lib/resume-keyword-placement'

export interface DocxTextEdit {
  /** Exact phrase from the resume (must appear in document text). */
  original: string
  /** Replacement phrase — same structure, keywords woven in. */
  suggested: string
}

export interface DocxPatchResult {
  buffer: Buffer
  appliedEdits: DocxTextEdit[]
  wovenKeywords: string[]
}

const DOCX_XML_PART = /^word\/(document|header\d+|footer\d+|footnotes)\.xml$/

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function encodeXmlEntities(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

interface WtNode {
  index: number
  length: number
  attrs: string
  text: string
}

function findWtNodes(xml: string): WtNode[] {
  const nodes: WtNode[] = []
  const re = /<w:t([^>]*)>([\s\S]*?)<\/w:t>/g
  let match: RegExpExecArray | null
  while ((match = re.exec(xml)) !== null) {
    nodes.push({
      index: match.index,
      length: match[0].length,
      attrs: match[1],
      text: decodeXmlEntities(match[2]),
    })
  }
  return nodes
}

function buildWtTag(attrs: string, text: string): string {
  const needsPreserve =
    attrs.includes('xml:space="preserve"') || /^\s|\s$/.test(text) || text.includes('  ')
  const openAttrs = needsPreserve
    ? attrs.includes('xml:space="preserve"')
      ? attrs
      : `${attrs} xml:space="preserve"`
    : attrs
  return `<w:t${openAttrs}>${encodeXmlEntities(text)}</w:t>`
}

function collapseText(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase()
}

/** Plain text as Word stores it in `<w:t>` nodes (best match source for AI edits). */
export async function extractDocxPlainText(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer)
  const raw = await zip.file('word/document.xml')?.async('string')
  if (!raw) return ''
  return findWtNodes(raw)
    .map((n) => n.text)
    .join('')
}

export function phraseInDocxText(phrase: string, docxPlain: string): boolean {
  const needle = phrase.trim()
  if (!needle) return false
  if (docxPlain.includes(needle)) return true
  return collapseText(docxPlain).includes(collapseText(needle))
}

function findPlainMatch(plain: string, needle: string): { start: number; length: number } | null {
  const trimmed = needle.trim()
  if (!trimmed) return null

  const direct = plain.indexOf(trimmed)
  if (direct !== -1) return { start: direct, length: trimmed.length }

  const collapsedNeedle = collapseText(trimmed)
  const collapsedPlain = collapseText(plain)
  const collapsedIndex = collapsedPlain.indexOf(collapsedNeedle)
  if (collapsedIndex === -1) return null

  // Map collapsed start back to original plain-string index.
  let ci = 0
  let oi = 0
  while (oi < plain.length && ci < collapsedIndex) {
    if (/\s/.test(plain[oi])) {
      while (oi + 1 < plain.length && /\s/.test(plain[oi + 1])) oi++
    }
    oi++
    ci++
  }

  // Map collapsed length back to original span length.
  let span = 0
  let consumed = 0
  while (oi + span < plain.length && consumed < collapsedNeedle.length) {
    if (/\s/.test(plain[oi + span])) {
      while (oi + span + 1 < plain.length && /\s/.test(plain[oi + span + 1])) span++
    }
    span++
    consumed++
  }

  return { start: oi, length: Math.max(span, trimmed.length) }
}

/** If edit only extends a skill category line, append via non-bold run instead of inline replace. */
function tryAppendCategoryEdit(xml: string, original: string, suggested: string): string | null {
  const orig = original.trim()
  const next = suggested.trim()
  if (!orig || !next || next === orig || !orig.includes(':')) return null
  if (!next.startsWith(orig) && !collapseText(next).startsWith(collapseText(orig))) return null

  const added = next.slice(orig.length).replace(/^[,;\s]+/, '').trim()
  if (!added) return null

  let replaced = false
  const updated = xml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (para) => {
    if (replaced || !paragraphText(para).includes(orig.split(':')[0])) return para
    if (!paragraphText(para).includes(':')) return para
    replaced = true
    return appendKeywordsToCategoryParagraph(para, added)
  })

  return replaced ? updated : null
}

/** Replace phrase only inside Word text runs (<w:t>) — never touches styles or layout XML. */
function applyEditToXmlPart(xml: string, original: string, suggested: string): string {
  const orig = original.trim()
  const next = suggested.trim()
  if (!orig || orig === next) return xml

  const appended = tryAppendCategoryEdit(xml, orig, next)
  if (appended) return appended

  const nodes = findWtNodes(xml)
  if (!nodes.length) return xml

  const plain = nodes.map((n) => n.text).join('')
  const match = findPlainMatch(plain, orig)
  if (!match) return xml

  const { start, length } = match
  const end = start + length
  let cursor = 0
  let startNode = -1
  let endNode = -1
  let startOffset = 0
  let endOffset = 0

  for (let i = 0; i < nodes.length; i++) {
    const len = nodes[i].text.length
    if (startNode === -1 && start < cursor + len) {
      startNode = i
      startOffset = start - cursor
    }
    if (end <= cursor + len) {
      endNode = i
      endOffset = end - cursor
      break
    }
    cursor += len
  }

  if (startNode === -1 || endNode === -1) return xml

  const newTexts = nodes.map((n) => n.text)
  const before = newTexts[startNode].slice(0, startOffset)
  const after = newTexts[endNode].slice(endOffset)

  if (startNode === endNode) {
    newTexts[startNode] = before + next + after
  } else {
    newTexts[startNode] = before + next
    for (let i = startNode + 1; i < endNode; i++) newTexts[i] = ''
    newTexts[endNode] = after
  }

  let result = xml
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i]
    if (newTexts[i] === node.text) continue
    const replacement = buildWtTag(node.attrs, newTexts[i])
    result = result.slice(0, node.index) + replacement + result.slice(node.index + node.length)
  }

  return result
}

function isSkillsHeading(text: string): boolean {
  const normalized = text.trim().toLowerCase().replace(/\s+/g, ' ')
  return (
    normalized === 'skills' ||
    normalized === 'technical skills' ||
    normalized === 'core skills' ||
    normalized === 'technical skill' ||
    /^technical\s+skills\b/.test(normalized)
  )
}

function isMajorSectionHeading(text: string): boolean {
  const normalized = text.trim().toLowerCase()
  return /^(relevant\s+)?experience$|^education$|^projects$|^certifications$|^summary$|^contact$/.test(
    normalized
  )
}

/** e.g. "Languages: Python, SQL" or "Tools: Kubernetes, Git" */
function isSkillCategoryLine(text: string): boolean {
  const t = text.trim()
  return /^[A-Za-z][A-Za-z0-9\s/&+\-]{0,45}:\s*\S/.test(t)
}

function findSkillsSectionStart(plain: string): number {
  const headers = ['TECHNICAL SKILLS', 'Technical Skills', 'Core Skills', 'SKILLS', 'Skills']
  for (const h of headers) {
    const idx = plain.indexOf(h)
    if (idx !== -1) return idx + h.length
  }
  return -1
}


function paragraphText(paraXml: string): string {
  return findWtNodes(paraXml).map((n) => n.text).join('')
}

function isCategoryParagraph(paraXml: string, categoryLabel: string): boolean {
  const text = paragraphText(paraXml).toLowerCase()
  const label = categoryLabel.trim().toLowerCase()
  return text.includes(`${label}:`)
}

function isRunBold(runXml: string): boolean {
  const rPr = runXml.match(/<w:rPr\b[\s\S]*?<\/w:rPr>/)?.[0] ?? ''
  if (/<w:b\s+w:val="(?:false|0)"\s*\/>/.test(rPr)) return false
  if (/<w:b\b/.test(rPr)) return true
  return false
}

/** Build rPr with explicit non-bold, preserving font size/family from an existing run. */
function buildNonBoldRunProperties(rPrSource: string | null): string {
  if (!rPrSource) {
    return '<w:rPr><w:b w:val="0"/><w:bCs w:val="0"/></w:rPr>'
  }
  const parts: string[] = []
  const rFonts = rPrSource.match(/<w:rFonts\b[^>]*\/>/)?.[0]
  const sz = rPrSource.match(/<w:sz\b[^>]*\/>/)?.[0]
  const szCs = rPrSource.match(/<w:szCs\b[^>]*\/>/)?.[0]
  const color = rPrSource.match(/<w:color\b[^>]*\/>/)?.[0]
  if (rFonts) parts.push(rFonts)
  if (sz) parts.push(sz)
  if (szCs) parts.push(szCs)
  if (color) parts.push(color)
  parts.push('<w:b w:val="0"/>', '<w:bCs w:val="0"/>')
  return `<w:rPr>${parts.join('')}</w:rPr>`
}

function findSkillsBodyRun(paraXml: string): string | null {
  const runs = [...paraXml.matchAll(/<w:r\b[\s\S]*?<\/w:r>/g)]
  for (const m of runs) {
    const run = m[0]
    const wt = run.match(/<w:t([^>]*)>([\s\S]*?)<\/w:t>/)
    if (!wt) continue
    const text = decodeXmlEntities(wt[2]).trim()
    if (!text || /^[A-Za-z][A-Za-z0-9\s/&+\-]{0,45}:$/.test(text)) continue
    if (text.includes(',') && !isRunBold(run)) return run
  }
  for (const m of runs) {
    const run = m[0]
    if (isRunBold(run)) continue
    if (run.includes('<w:t')) return run
  }
  return null
}

function pickRunPropertiesForBody(paraXml: string): string | null {
  const bodyRun = findSkillsBodyRun(paraXml)
  if (bodyRun) {
    return bodyRun.match(/<w:rPr\b[\s\S]*?<\/w:rPr>/)?.[0] ?? null
  }
  for (const m of paraXml.matchAll(/<w:r\b[\s\S]*?<\/w:r>/g)) {
    const run = m[0]
    if (isRunBold(run)) continue
    const rPr = run.match(/<w:rPr\b[\s\S]*?<\/w:rPr>/)?.[0]
    if (rPr) return rPr
  }
  for (const m of paraXml.matchAll(/<w:r\b[\s\S]*?<\/w:r>/g)) {
    const rPr = m[0].match(/<w:rPr\b[\s\S]*?<\/w:rPr>/)?.[0]
    if (rPr) return rPr
  }
  return null
}

/** Append keywords in a new run with explicit regular weight (never inherit bold from label). */
function appendKeywordsToCategoryParagraph(paraXml: string, textToAppend: string): string {
  const addition = textToAppend.startsWith(',') ? textToAppend : `, ${textToAppend}`
  const rPr = buildNonBoldRunProperties(pickRunPropertiesForBody(paraXml))
  const run = `<w:r>${rPr}<w:t xml:space="preserve">${encodeXmlEntities(addition)}</w:t></w:r>`
  return paraXml.replace(/<\/w:p>\s*$/, `${run}</w:p>`)
}

/** Read categorized skill lines from paragraph text (handles split bold label + regular body runs). */
export function extractSkillCategoriesFromXml(xml: string): SkillCategory[] {
  const fullPlain = findWtNodes(xml).map((n) => n.text).join('')
  const sectionStart = findSkillsSectionStart(fullPlain)
  const results: SkillCategory[] = []
  let cursor = 0

  for (const para of xml.match(/<w:p\b[\s\S]*?<\/w:p>/g) || []) {
    const text = paragraphText(para)
    const paraEnd = cursor + text.length
    cursor = paraEnd

    if (sectionStart !== -1 && paraEnd <= sectionStart) continue

    const trimmed = text.trim()
    if (!trimmed) continue
    if (isSkillsHeading(trimmed)) continue
    if (isMajorSectionHeading(trimmed)) break

    const colonIdx = trimmed.indexOf(':')
    if (colonIdx > 0 && colonIdx <= 50) {
      const label = trimmed.slice(0, colonIdx).trim()
      const after = trimmed.slice(colonIdx + 1).trim()
      if (label && after && /^[A-Za-z]/.test(label)) {
        results.push({ label, lineText: trimmed })
      }
    }
  }

  return results
}

/** @deprecated Use extractSkillCategoriesFromXml — kept for plain-node scans. */
export function extractSkillCategoriesFromNodes(nodes: WtNode[]): SkillCategory[] {
  const plain = nodes.map((n) => n.text).join('')
  const sectionStart = findSkillsSectionStart(plain)
  let cursor = 0
  const results: SkillCategory[] = []

  for (let i = 0; i < nodes.length; i++) {
    const t = nodes[i].text
    const nodeEnd = cursor + t.length
    cursor = nodeEnd

    if (sectionStart !== -1 && nodeEnd <= sectionStart) continue

    const trimmed = t.trim()
    if (!trimmed) continue
    if (isSkillsHeading(trimmed)) continue
    if (isMajorSectionHeading(trimmed)) break

    if (isSkillCategoryLine(trimmed)) {
      const label = trimmed.split(':')[0]?.trim() || ''
      if (label) results.push({ label, lineText: trimmed })
    }
  }

  return results
}

export async function extractSkillCategoriesFromBuffer(buffer: Buffer): Promise<SkillCategory[]> {
  const zip = await JSZip.loadAsync(buffer)
  const raw = await zip.file('word/document.xml')?.async('string')
  if (!raw) return []
  return extractSkillCategoriesFromXml(raw)
}

/** Append each keyword via a new regular-weight run at the end of its category paragraph. */
function weaveKeywordsInXmlPart(
  xml: string,
  placements: KeywordPlacement[]
): { xml: string; woven: string[] } {
  if (!placements.length) return { xml, woven: [] }

  let nextXml = xml
  const woven: string[] = []
  const plainLower = findWtNodes(xml)
    .map((n) => n.text)
    .join('')
    .toLowerCase()

  const byCategory = new Map<string, string[]>()
  for (const { keyword, category } of placements) {
    const kw = keyword.trim()
    if (!kw || plainLower.includes(kw.toLowerCase())) continue
    const key = category.trim().toLowerCase()
    if (!byCategory.has(key)) byCategory.set(key, [])
    byCategory.get(key)!.push(kw)
  }

  if (!byCategory.size) return { xml, woven: [] }

  const categories = extractSkillCategoriesFromXml(nextXml)
  const ordered = categories
    .map((cat) => ({ cat, kws: byCategory.get(cat.label.toLowerCase()) }))
    .filter((entry) => entry.kws?.length)
    .reverse()

  for (const { cat, kws } of ordered) {
    if (!kws?.length) continue

    nextXml = nextXml.replace(/<w:p\b[\s\S]*?<\/w:p>/g, (para) => {
      if (!isCategoryParagraph(para, cat.label)) return para

      const plain = paragraphText(para).toLowerCase()
      const missing = kws.filter((k) => !plain.includes(k.toLowerCase()))
      if (!missing.length) return para

      woven.push(...missing)
      return appendKeywordsToCategoryParagraph(para, `, ${missing.join(', ')}`)
    })
  }

  return { xml: nextXml, woven }
}

/**
 * Apply text substitutions inside a DOCX while preserving styles, alignment,
 * fonts, and theme. Only `<w:t>` text nodes are edited — layout XML is never touched.
 */
export async function patchDocxText(
  buffer: Buffer,
  edits: DocxTextEdit[],
  placements: KeywordPlacement[] = []
): Promise<DocxPatchResult> {
  const zip = await JSZip.loadAsync(buffer)
  const paths = Object.keys(zip.files).filter((path) => DOCX_XML_PART.test(path))
  let changed = false
  const appliedEdits: DocxTextEdit[] = []
  let wovenKeywords: string[] = []

  for (const docPath of paths) {
    const raw = await zip.file(docPath)?.async('string')
    if (!raw) continue

    let xml = raw
    for (const edit of edits) {
      if (!edit.original?.trim() || edit.original === edit.suggested) continue
      const next = applyEditToXmlPart(xml, edit.original, edit.suggested)
      if (next !== xml) {
        appliedEdits.push(edit)
        xml = next
        changed = true
      }
    }

    if (docPath === 'word/document.xml' && placements.length) {
      const woven = weaveKeywordsInXmlPart(xml, placements)
      if (woven.woven.length) {
        xml = woven.xml
        wovenKeywords = [...wovenKeywords, ...woven.woven]
        changed = true
      }
    }

    if (xml !== raw) {
      zip.file(docPath, xml)
    }
  }

  if (!changed) {
    return { buffer, appliedEdits, wovenKeywords }
  }

  return {
    buffer: Buffer.from(
      await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      })
    ),
    appliedEdits,
    wovenKeywords,
  }
}
