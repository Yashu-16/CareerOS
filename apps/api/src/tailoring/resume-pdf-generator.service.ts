import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { TailoredResumeContent, ProfileSnapshot } from './tailoring-ai.service';

const PAGE_WIDTH = 612; // US Letter, points
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

@Injectable()
export class ResumePdfGeneratorService {
  async generate(profile: ProfileSnapshot, content: TailoredResumeContent): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;

    const ensureSpace = (needed: number) => {
      if (y - needed < MARGIN) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN;
      }
    };

    const drawWrappedText = (text: string, size: number, useFont = font, lineGap = 4, color = rgb(0.1, 0.1, 0.1)) => {
      const words = text.split(' ');
      let line = '';
      const maxWidth = CONTENT_WIDTH;

      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word;
        const width = useFont.widthOfTextAtSize(testLine, size);
        if (width > maxWidth && line) {
          ensureSpace(size + lineGap);
          page.drawText(line, { x: MARGIN, y, size, font: useFont, color });
          y -= size + lineGap;
          line = word;
        } else {
          line = testLine;
        }
      }
      if (line) {
        ensureSpace(size + lineGap);
        page.drawText(line, { x: MARGIN, y, size, font: useFont, color });
        y -= size + lineGap;
      }
    };

    const drawHeading = (text: string) => {
      ensureSpace(28);
      y -= 10;
      page.drawText(text.toUpperCase(), {
        x: MARGIN,
        y,
        size: 13,
        font: boldFont,
        color: rgb(0.1, 0.15, 0.45),
      });
      y -= 4;
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: PAGE_WIDTH - MARGIN, y },
        thickness: 1,
        color: rgb(0.18, 0.45, 0.8),
      });
      y -= 16;
    };

    // Name
    page.drawText(profile.fullName, { x: MARGIN, y, size: 22, font: boldFont, color: rgb(0, 0, 0) });
    y -= 26;

    if (profile.headline) {
      drawWrappedText(profile.headline, 11, font, 4, rgb(0.35, 0.35, 0.35));
      y -= 6;
    }

    drawHeading('Professional Summary');
    drawWrappedText(content.summary, 10.5);

    drawHeading('Skills');
    drawWrappedText(content.orderedSkills.join('   •   '), 10.5);

    if (content.experienceBullets.length > 0) {
      drawHeading('Experience');
      for (const exp of content.experienceBullets) {
        ensureSpace(16);
        page.drawText(`${exp.title} — ${exp.company}`, { x: MARGIN, y, size: 11.5, font: boldFont });
        y -= 16;
        for (const bullet of exp.bullets) {
          drawWrappedText(`•  ${bullet}`, 10);
        }
        y -= 6;
      }
    }

    if (content.projectHighlights.length > 0) {
      drawHeading('Projects');
      for (const proj of content.projectHighlights) {
        ensureSpace(16);
        page.drawText(proj.name, { x: MARGIN, y, size: 11.5, font: boldFont });
        y -= 16;
        for (const bullet of proj.bullets) {
          drawWrappedText(`•  ${bullet}`, 10);
        }
        y -= 6;
      }
    }

    if (profile.education.length > 0) {
      drawHeading('Education');
      for (const edu of profile.education) {
        const line = `${edu.degree}${edu.fieldOfStudy ? ', ' + edu.fieldOfStudy : ''} — ${edu.institution}`;
        drawWrappedText(line, 10.5);
      }
    }

    if (profile.certifications.length > 0) {
      drawHeading('Certifications');
      for (const cert of profile.certifications) {
        drawWrappedText(`•  ${cert.name}${cert.issuer ? ' — ' + cert.issuer : ''}`, 10);
      }
    }

    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
  }
}
