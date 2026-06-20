import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 54
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

/** Standard PDF fonts only support WinAnsi — normalize resume text before rendering. */
export function sanitizeForPdfText(text: string): string {
  let out = text.normalize('NFKC')
  const replacements: [RegExp, string][] = [
    [/\u2192/g, '->'],
    [/\u2190/g, '<-'],
    [/\u2194/g, '<->'],
    [/\u2022|\u2023|\u25CF|\u25E6|\u2043/g, '-'],
    [/\u2013|\u2014/g, '-'],
    [/\u2018|\u2019|\u2032/g, "'"],
    [/\u201C|\u201D|\u2033/g, '"'],
    [/\u00B7|\u2219/g, '-'],
    [/\u2026/g, '...'],
    [/\u00A0/g, ' '],
    [/[\u200B-\u200D\uFEFF]/g, ''],
  ]
  for (const [pattern, repl] of replacements) {
    out = out.replace(pattern, repl)
  }
  return out.replace(/[^\t\n\r\u0020-\u007E\u00A0-\u00FF]/g, '')
}

function appendSkillsToText(text: string, keywords: string[]): string {
  if (!keywords.length) return text
  const addition = keywords.slice(0, 8).join(', ')
  const lower = text.toLowerCase()
  if (lower.includes('skills') && !lower.includes(addition.toLowerCase())) {
    return text.replace(/(skills[^\n]*\n)/i, `$1${addition}\n`)
  }
  return `${text.trim()}\n\nSkills: ${addition}\n`
}

function lineStyle(trimmed: string): 'header' | 'bullet' | 'body' {
  if (!trimmed) return 'body'
  if (/^[-*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) return 'bullet'
  if (
    trimmed.length <= 55 &&
    (trimmed === trimmed.toUpperCase() ||
      (/^[A-Z][A-Za-z0-9\s/&|,-]+$/.test(trimmed) && !trimmed.endsWith('.')))
  ) {
    return 'header'
  }
  return 'body'
}

function wrapLine(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (!words.length) return ['']

  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

/** Build a tailored resume PDF from plain text (preserves section structure). */
export async function buildTailoredPdf(text: string, subtitle?: string): Promise<Buffer> {
  const content = sanitizeForPdfText(text)
  const safeSubtitle = subtitle ? sanitizeForPdfText(subtitle) : undefined

  const pdfDoc = await PDFDocument.create()
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      y = PAGE_HEIGHT - MARGIN
    }
  }

  const drawWrapped = (
    lineText: string,
    font: PDFFont,
    size: number,
    color: ReturnType<typeof rgb>,
    x: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    for (const wrapped of wrapLine(lineText, font, size, maxWidth)) {
      ensureSpace(lineHeight)
      page.drawText(wrapped, { x, y: y - size, size, font, color })
      y -= lineHeight
    }
  }

  if (safeSubtitle) {
    for (const wrapped of wrapLine(safeSubtitle, fontRegular, 9, CONTENT_WIDTH)) {
      ensureSpace(12)
      const textWidth = fontRegular.widthOfTextAtSize(wrapped, 9)
      page.drawText(wrapped, {
        x: PAGE_WIDTH - MARGIN - textWidth,
        y: y - 9,
        size: 9,
        font: fontRegular,
        color: rgb(0.4, 0.4, 0.4),
      })
      y -= 12
    }
    y -= 6
  }

  for (const line of content.trim().split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) {
      y -= 8
      continue
    }

    switch (lineStyle(trimmed)) {
      case 'header':
        y -= 4
        drawWrapped(trimmed, fontBold, 11, rgb(0.07, 0.07, 0.07), MARGIN, CONTENT_WIDTH, 14)
        break
      case 'bullet':
        drawWrapped(trimmed, fontRegular, 10, rgb(0.2, 0.2, 0.2), MARGIN + 14, CONTENT_WIDTH - 14, 12)
        break
      default:
        drawWrapped(trimmed, fontRegular, 10, rgb(0.2, 0.2, 0.2), MARGIN, CONTENT_WIDTH, 12)
    }
  }

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

export function tailoredOutputFilename(
  baseName: string,
  company: string,
  ext: 'pdf' | 'docx'
): string {
  const stem = baseName.replace(/\.(pdf|docx?|doc)$/i, '')
  const co = company.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_').slice(0, 40)
  return `${stem}_tailored_${co || 'role'}.${ext}`
}

export function tailoredPdfFilename(baseName: string, company: string): string {
  return tailoredOutputFilename(baseName, company, 'pdf')
}

export function isPdfBuffer(buffer: Buffer): boolean {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-'
}

export function asPdfFilename(filename: string): string {
  if (/\.pdf$/i.test(filename)) return filename
  return filename.replace(/\.(docx?|doc)$/i, '') + '.pdf'
}

export { appendSkillsToText }
