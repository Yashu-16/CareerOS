import type { DocxTextEdit } from '@/lib/resume-docx-patch'

function escapePdfLiteral(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function unescapePdfLiteral(text: string): string {
  return text.replace(/\\([\\()nrtbf])/g, (_, ch) => {
    switch (ch) {
      case 'n':
        return '\n'
      case 'r':
        return '\r'
      case 't':
        return '\t'
      case 'b':
        return '\b'
      case 'f':
        return '\f'
      default:
        return ch
    }
  })
}

/** Replace text only inside PDF string literals `(like this)` — never touches binary/structure. */
function replaceInPdfLiterals(content: string, from: string, to: string): string {
  if (!from || from === to) return content

  return content.replace(/\((?:\\.|[^\\)])*\)/g, (literal) => {
    const inner = literal.slice(1, -1)
    const decoded = unescapePdfLiteral(inner)
    if (!decoded.includes(from)) return literal
    const updated = decoded.split(from).join(to)
    return `(${escapePdfLiteral(updated)})`
  })
}

/**
 * Apply keyword edits inside a PDF while preserving layout.
 * Only PDF text literals are edited — no full-file string replacement.
 */
export async function patchPdfText(buffer: Buffer, edits: DocxTextEdit[]): Promise<Buffer> {
  if (!edits.length) return buffer

  let content = buffer.toString('latin1')
  const before = content
  for (const { original, suggested } of edits) {
    if (!original?.trim() || original === suggested) continue
    content = replaceInPdfLiterals(content, original.trim(), suggested.trim())
  }
  if (content === before) return buffer
  return Buffer.from(content, 'latin1')
}
