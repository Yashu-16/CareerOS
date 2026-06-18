import mammoth from 'mammoth'

/**
 * Extract plain text from a resume buffer (PDF or DOCX).
 * pdf-parse is imported dynamically to avoid its debug-mode top-level file read.
 */
export async function parseResumeBuffer(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf') {
    const pdfModule = await import('pdf-parse')
    const pdf = (pdfModule as any).default || pdfModule
    const parsed = await pdf(buffer)
    return parsed.text
  }
  // DOCX (and fallback)
  const parsed = await mammoth.extractRawText({ buffer })
  return parsed.value
}
