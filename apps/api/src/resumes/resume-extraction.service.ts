import { Injectable } from '@nestjs/common';
import * as mammoth from 'mammoth';
// pdf-parse has no official types; require keeps this simple and avoids ESM/CJS friction.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

@Injectable()
export class ResumeExtractionService {
  async extractText(buffer: Buffer, fileType: 'PDF' | 'DOCX'): Promise<string> {
    if (fileType === 'PDF') {
      const result = await pdfParse(buffer);
      return this.normalizeWhitespace(result.text);
    }

    const result = await mammoth.extractRawText({ buffer });
    return this.normalizeWhitespace(result.value);
  }

  private normalizeWhitespace(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}
