import JSZip from 'jszip'

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function paragraph(text: string): string {
  const lines = text.split('\n').filter((l) => l.trim())
  return lines
    .map(
      (line) =>
        `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr><w:r><w:rPr><w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`
    )
    .join('')
}

/** Build a minimal DOCX from plain text (used when source resume is PDF). */
export async function buildSimpleDocx(text: string, titleHint: string): Promise<Buffer> {
  const body = paragraph(text)
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${body}<w:sectPr/></w:body>
</w:document>`

  const contentTypes = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

  const rels = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  const zip = new JSZip()
  zip.file('[Content_Types].xml', contentTypes)
  zip.folder('_rels')?.file('.rels', rels)
  zip.folder('word')?.file('document.xml', documentXml)

  return Buffer.from(await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }))
}

export function guessFilenameFromHint(hint: string): string {
  return hint.replace(/\.(pdf|docx)$/i, '') + '_tailored.docx'
}
